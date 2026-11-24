// Vista «Ensayo»: suena el coro, se oye la voz por el micrófono y se compara,
// nota a nota, con la cuerda elegida.

import { nombreNota, notaEn, siguienteNota, fraseDe, compasDe } from './partitura.js';
import { obtenerAudio, audioActual, explicarErrorMicro } from './audio.js';
import { Evaluador, ESTADO, desvio as calcularDesvio } from './evaluacion.js';
import { Rollo } from './rollo.js';

const $ = (id) => document.getElementById(id);
const plural = (n, uno, varios) => (n === 1 ? uno : varios);
const RANGO_AGUJA = 250; // cents que abarca medio carril del afinador

function elemento(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto != null) el.textContent = texto;
  return el;
}

function icono(nombre) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icono');
  svg.setAttribute('aria-hidden', 'true');
  const uso = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  uso.setAttribute('href', `#i-${nombre}`);
  svg.append(uso);
  return svg;
}

export function iniciarEnsayo({ partitura, estado, guardar }) {
  const vista = $('vista-ensayo');
  const rollo = new Rollo($('rollo'));
  const ppc = partitura.pulsosPorCompas;

  let audio = null;
  let conectado = false;
  let ocupado = false;
  let voz = partitura.voces.find((v) => v.id === estado.cuerda) ?? partitura.voces[0];
  let evaluador = null;
  let traza = [];
  let cursor = 0; // posición mientras aún no hay audio
  let indiceBucle = 0;

  let cuadro = null;
  let previo = 0;
  let ultimoTexto = 0;
  let fraseVista = -1;
  let silabaVista = -2;
  let silabas = [];
  let desvioSuave = null;
  let notaSuave = null;

  const tolerancia = () => (estado.exigente ? 30 : 50);
  const sonando = () => Boolean(audio?.coro.sonando);
  const posicion = () => (audio ? audio.coro.posicionOida : cursor);

  /** Lo que se repite: un compás de entrada, la frase y un pulso de respiro. */
  function tramo(frase) {
    const desde = Math.max(0, (Math.floor(frase.desde / ppc) - 1) * ppc);
    return { desde, hasta: Math.min(partitura.total, frase.hasta + 1), corte: frase.hasta };
  }

  const fraseEnCurso = (pos) => (estado.bucle ? voz.frases[indiceBucle] : fraseDe(voz, pos));

  // ── Sonido ──────────────────────────────────────────

  function aplicarMezcla() {
    if (!audio) return;
    const propia = { fuerte: 1, suave: 0.4, callada: 0 }[estado.miVoz] ?? 1;
    const otras = { fuerte: 0.6, suave: 0.85, callada: 0.9 }[estado.miVoz] ?? 0.6;
    for (const v of partitura.voces) {
      const callada = v !== voz && estado.silenciadas.includes(v.id);
      audio.coro.volumen(v.id, callada ? 0 : v === voz ? propia : otras);
    }
    for (const a of partitura.acompanamiento) {
      audio.coro.volumen(a.id, estado.silenciadas.includes(a.id) ? 0 : 0.9);
    }
  }

  function aplicarBucle() {
    if (audio) audio.coro.bucle = estado.bucle ? tramo(voz.frases[indiceBucle]) : null;
  }

  function avisar(texto) {
    const aviso = $('ensayo-aviso');
    aviso.hidden = !texto;
    aviso.textContent = texto ?? '';
  }

  async function listarMicros() {
    try {
      const dispositivos = await navigator.mediaDevices.enumerateDevices();
      const micros = dispositivos.filter(
        (d) => d.kind === 'audioinput' && d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications',
      );
      const selector = $('sel-micro');
      const opciones = [new Option('El del sistema', '')];
      micros.forEach((d, i) => opciones.push(new Option(d.label || `Micrófono ${i + 1}`, d.deviceId)));
      selector.replaceChildren(...opciones);
      selector.value = micros.some((d) => d.deviceId === estado.micro) ? estado.micro : '';
    } catch {
      /* sin lista: se queda el micrófono del sistema */
    }
  }

  async function encenderMicro() {
    try {
      await audio.mic.iniciar({ cancelarEco: !estado.auriculares, dispositivo: estado.micro || null });
      avisar(null);
      listarMicros();
    } catch (error) {
      if (estado.micro && error?.name === 'OverconstrainedError') {
        estado.micro = '';
        guardar();
        await encenderMicro();
        return;
      }
      avisar(`${explicarErrorMicro(error)} Mientras tanto puedes escuchar y cantar encima, pero no veré tu voz.`);
    }
  }

  /** Primer gesto del usuario: se crea el audio y se pide el micrófono. */
  async function encender() {
    audio = obtenerAudio(partitura);
    if (!conectado) {
      conectado = true;
      const coro = audio.coro;
      coro.ir(cursor);
      coro.tempo = estado.tempo;
      coro.transporte = estado.transporte;
      coro.claqueta = estado.claqueta;
      coro.addEventListener('estado', pintarBoton);
      coro.addEventListener('fin', () => mostrarResumen(true));
      coro.addEventListener('vuelta', alDarVuelta);
      aplicarMezcla();
      aplicarBucle();
    }
    if (!audio.mic.activo) await encenderMicro();
  }

  // ── Transporte ──────────────────────────────────────

  function irA(pulso) {
    const destino = Math.max(0, Math.min(partitura.total, pulso));
    if (audio) audio.coro.ir(destino);
    else cursor = destino;
    traza = [];
    evaluador.reiniciar(destino - 0.001, Infinity);
    $('resumen').hidden = true;
    $('pasada').hidden = true;
    pintarBoton();
  }

  async function alternar() {
    if (ocupado) return;
    ocupado = true;
    try {
      await encender();
      const coro = audio.coro;
      if (coro.sonando) {
        coro.pausar();
        mostrarResumen(false);
        return;
      }
      if (coro.posicion >= partitura.total - 0.01) {
        irA(estado.bucle ? tramo(voz.frases[indiceBucle]).desde : 0);
      }
      $('resumen').hidden = true;
      await coro.reproducir();
    } finally {
      ocupado = false;
    }
  }

  function pintarBoton() {
    const suena = sonando();
    $('reproducir-icono').setAttribute('href', suena ? '#i-pausa' : '#i-play');
    const pos = posicion();
    $('reproducir-texto').textContent = suena ? 'Pausa' : pos >= partitura.total - 0.01 ? 'Otra vez' : pos > 0.01 ? 'Seguir' : 'Empezar';
  }

  function alDarVuelta() {
    const frase = voz.frases[indiceBucle];
    const r = evaluador.resumen(frase.desde, frase.hasta);
    if (r.total) {
      $('pasada').textContent = `Última pasada: afinaste ${r.bien} de ${r.total} ${plural(r.total, 'nota', 'notas')}`;
      $('pasada').hidden = false;
    }
    evaluador.reiniciar(frase.desde - 0.001, frase.hasta);
    traza = [];
  }

  function repetirFrase(k) {
    estado.bucle = true;
    $('chk-bucle').checked = true;
    indiceBucle = k;
    guardar();
    irA(tramo(voz.frases[k]).desde);
    aplicarBucle();
    document.querySelector('.escenario').scrollIntoView({ block: 'start', behavior: 'smooth' });
    if (!sonando()) alternar();
  }

  // ── Cuerda, frases y ajustes ────────────────────────

  function pintarFrases() {
    const opciones = voz.frases.map((f) => new Option(`${f.texto} · compás ${compasDe(partitura, f.desde)}`, f.i));
    $('selector-frase').replaceChildren(...opciones);
  }

  function pintarOtrasVoces() {
    const caja = $('otras-voces');
    const partes = [
      ...partitura.voces.filter((v) => v !== voz).map((v) => ({ id: v.id, nombre: v.nombre })),
      ...partitura.acompanamiento.map((a) => ({ id: a.id, nombre: `${a.nombre} (introducción y finales)` })),
    ];
    caja.replaceChildren(
      ...partes.map((parte) => {
        const etiqueta = elemento('label', 'casilla');
        const casilla = document.createElement('input');
        casilla.type = 'checkbox';
        casilla.checked = !estado.silenciadas.includes(parte.id);
        casilla.addEventListener('change', () => {
          estado.silenciadas = estado.silenciadas.filter((id) => id !== parte.id);
          if (!casilla.checked) estado.silenciadas.push(parte.id);
          guardar();
          aplicarMezcla();
        });
        etiqueta.append(casilla, elemento('span', null, parte.nombre));
        return etiqueta;
      }),
    );
  }

  function ponerCuerda(id) {
    voz = partitura.voces.find((v) => v.id === id) ?? partitura.voces[0];
    estado.cuerda = voz.id;
    guardar();
    evaluador = new Evaluador(voz.notas, { tolerancia: tolerancia(), aceptarOctavas: estado.octavas });
    traza = [];
    vista.className = `vista vista--ensayo tinte-${voz.tinte}`;
    for (const radio of $('selector-cuerda').querySelectorAll('input')) radio.checked = radio.value === voz.id;
    pintarFrases();
    pintarOtrasVoces();
    indiceBucle = Math.min(indiceBucle, voz.frases.length - 1);
    aplicarMezcla();
    aplicarBucle();
    rollo.configurar({ partitura, voz, verTodas: estado.verTodas, transporte: estado.transporte });
    fraseVista = -1;
    $('resumen').hidden = true;
    $('pasada').hidden = true;
  }

  function pintarTono() {
    const t = estado.transporte;
    const n = Math.abs(t);
    $('out-tono').textContent = t === 0 ? 'Tono original' : `${n} ${plural(n, 'semitono', 'semitonos')} más ${t > 0 ? 'agudo' : 'grave'}`;
    $('btn-tono-menos').disabled = t <= -6;
    $('btn-tono-mas').disabled = t >= 6;
  }

  function cambiarTono(paso) {
    estado.transporte = Math.max(-6, Math.min(6, estado.transporte + paso));
    guardar();
    if (audio) audio.coro.transporte = estado.transporte;
    rollo.configurar({ partitura, voz, verTodas: estado.verTodas, transporte: estado.transporte });
    pintarTono();
  }

  function pintarTempo() {
    const escrita = estado.tempo === partitura.tempo ? ' (la escrita)' : '';
    $('out-tempo').textContent = `${estado.tempo} pulsos por minuto${escrita}`;
  }

  // ── Letra ───────────────────────────────────────────

  function pintarLetra(frase) {
    fraseVista = frase.i;
    silabaVista = -2;
    silabas = [];
    const piezas = [];
    for (let i = frase.primera; i <= frase.ultima; i++) {
      const nota = voz.notas[i];
      if (!nota.silaba) continue;
      const el = elemento('span', 'silaba', nota.silaba);
      silabas.push({ el, ini: nota.ini });
      piezas.push(el);
      if (!nota.silaba.endsWith('-')) piezas.push(' ');
    }
    $('letra').replaceChildren(...piezas);
    const selector = $('selector-frase');
    if (Number(selector.value) !== frase.i) selector.value = String(frase.i);
  }

  function marcarSilaba(pos, frase) {
    let indice = -1;
    if (pos >= frase.hasta) indice = silabas.length;
    else for (let k = 0; k < silabas.length && silabas[k].ini <= pos; k++) indice = k;
    if (indice === silabaVista) return;
    silabaVista = indice;
    silabas.forEach(({ el }, k) => {
      el.classList.toggle('es-pasada', k < indice);
      el.classList.toggle('es-actual', k === indice);
    });
  }

  // ── Marcador ────────────────────────────────────────

  function pintarMarcador({ objetivo, proxima, desvio, lectura, suena, pos }) {
    const nota = objetivo ?? proxima;
    $('rotulo-pedida').textContent = suena && objetivo ? 'Toca cantar' : 'Tu próxima nota';
    $('nota-pedida').textContent = nota ? nombreNota(nota.midi + estado.transporte) : '—';
    $('nota-cantada').textContent = lectura.midi === null ? '—' : nombreNota(lectura.midi);
    $('ensayo-nivel').style.transform = `scaleX(${lectura.nivel.toFixed(3)})`;
    $('btn-oir').disabled = !nota;

    // El desvío se suaviza para que la aguja y la palabra no tiemblen.
    if (desvio === null) desvioSuave = null;
    else if (desvioSuave === null || nota !== notaSuave) desvioSuave = desvio;
    else desvioSuave += (desvio - desvioSuave) * 0.45;
    notaSuave = nota;

    let est;
    let texto;
    let dibujo;
    if (!audio?.mic.activo) [est, texto, dibujo] = ['sin-micro', 'Micrófono apagado', 'micro'];
    else if (suena && !objetivo) [est, texto, dibujo] = ['escucha', 'Escucha', 'altavoz'];
    else if (desvioSuave === null) [est, texto, dibujo] = ['canta', suena ? 'Canta' : 'Canta para probar', 'micro'];
    else if (Math.abs(desvioSuave) <= tolerancia()) [est, texto, dibujo] = ['afinado', 'Afinado', 'check'];
    else if (desvioSuave < 0) [est, texto, dibujo] = ['sube', desvioSuave < -150 ? 'Sube' : 'Sube un poco', 'arriba'];
    else [est, texto, dibujo] = ['baja', desvioSuave > 150 ? 'Baja' : 'Baja un poco', 'abajo'];

    const marcador = $('marcador');
    if (marcador.dataset.estado !== est) marcador.dataset.estado = est;
    if ($('veredicto-texto').textContent !== texto) {
      $('veredicto-texto').textContent = texto;
      $('veredicto-icono').setAttribute('href', `#i-${dibujo}`);
    }
    if (desvioSuave !== null) {
      const lado = Math.max(-1, Math.min(1, desvioSuave / RANGO_AGUJA));
      $('afinador-aguja').style.left = `${50 + lado * 50}%`;
    }

    // Dentro de la ventana, lo esencial: la corrección mientras se canta
    // y la cuenta atrás mientras se espera para entrar.
    const rotulo = $('entrada');
    const siguiente = siguienteNota(voz.notas, pos);
    const faltan = siguiente ? siguiente.ini - pos : null;
    let aviso = null;
    if (suena && objetivo && audio?.mic.activo) {
      aviso = [est, texto, dibujo];
    } else if (suena && !objetivo && faltan !== null && faltan > 0.5) {
      aviso = ['espera', faltan <= 8.5 ? `Entras en ${Math.ceil(faltan - 0.05)}` : 'Suenan las cuerdas', 'altavoz'];
    }
    rotulo.hidden = aviso === null;
    if (aviso && $('entrada-texto').textContent !== aviso[1]) {
      rotulo.dataset.estado = aviso[0];
      $('entrada-texto').textContent = aviso[1];
      $('entrada-icono').setAttribute('href', `#i-${aviso[2]}`);
    }
  }

  // ── Resumen ─────────────────────────────────────────

  function consejo(r) {
    if (r.bien === r.total) return 'Todos los cristales encendidos. Prueba ahora con tu cuerda en «Callada»: cantas solo contra las demás.';
    if (r.sinVoz > r.total * 0.4) return 'En muchas notas no te oí. Canta más cerca del micrófono y, si puedes, con auriculares.';
    if (r.baja >= 3 && r.baja >= 2 * Math.max(1, r.alta)) return 'Tiendes a quedarte por debajo de la nota. Piénsala un poco más arriba antes de atacarla.';
    if (r.alta >= 3 && r.alta >= 2 * Math.max(1, r.baja)) return 'Tiendes a pasarte por arriba. Escucha a las otras voces y ataca la nota con menos empuje.';
    return 'Repite las frases que tienen cristales apagados hasta encenderlos todos.';
  }

  function mostrarResumen(final) {
    const total = evaluador.resumen();
    const caja = $('resumen');
    if (total.total < 3) {
      caja.hidden = true;
      return;
    }
    $('resumen-titulo').textContent = `Afinaste ${total.bien} de ${total.total} notas`;
    $('resumen-consejo').textContent = consejo(total);

    const filas = [];
    for (const frase of voz.frases) {
      const r = evaluador.resumen(frase.desde, frase.hasta);
      if (!r.total) continue;
      const fila = elemento('li', `tinte-${voz.tinte}`);

      const texto = elemento('p', 'resumen__texto', frase.texto);
      const partes = [`${r.bien} de ${r.total} afinadas`];
      // Mismo lenguaje que las flechas: se dice qué hay que hacer, no qué salió mal.
      if (r.baja) partes.push(`${r.baja} para subir`);
      if (r.alta) partes.push(`${r.alta} para bajar`);
      if (r.sinVoz) partes.push(`${r.sinVoz} sin cantar`);
      texto.append(elemento('small', null, partes.join(' · ')));

      const tira = elemento('div', 'tira');
      tira.setAttribute('aria-hidden', 'true');
      for (let i = frase.primera; i <= frase.ultima; i++) {
        const e = evaluador.estado(i);
        if (e === ESTADO.PENDIENTE) continue;
        const cristal = elemento('span', `tira__nota es-${e}`);
        const nombre = nombreNota(voz.notas[i].midi + estado.transporte);
        if (e === ESTADO.BAJA) cristal.append(icono('arriba'));
        if (e === ESTADO.ALTA) cristal.append(icono('abajo'));
        cristal.title = `${nombre}: ${{ bien: 'afinada', baja: 'hay que subirla', alta: 'hay que bajarla', 'sin-voz': 'sin cantar' }[e]}`;
        tira.append(cristal);
      }

      const boton = elemento('button', 'boton boton--chico boton--secundario', 'Repetir');
      boton.type = 'button';
      boton.setAttribute('aria-label', `Repetir la frase «${frase.texto}»`);
      boton.addEventListener('click', () => repetirFrase(frase.i));

      fila.append(texto, tira, boton);
      filas.push(fila);
    }
    $('resumen-frases').replaceChildren(...filas);
    caja.hidden = false;
    if (final) {
      $('resumen-titulo').focus({ preventScroll: true });
      caja.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // ── Bucle de dibujo ─────────────────────────────────

  function cuadroNuevo() {
    cuadro = requestAnimationFrame(cuadroNuevo);
    const ahora = performance.now();
    const dt = Math.max(0, Math.min(0.1, (ahora - previo) / 1000));
    previo = ahora;

    const mic = audio?.mic.activo ? audio.mic : null;
    const lectura = mic ? mic.leer() : { midi: null, nivel: 0 };
    const pos = posicion();
    const suena = sonando();
    const tr = estado.transporte;

    let objetivo = null;
    let desvio = null;
    if (suena) {
      const bpm = audio.coro.bpm;
      const pulsoVoz = pos - ((mic ? mic.retraso : 0) * bpm) / 60;
      const apunte = evaluador.apuntar(pulsoVoz, lectura.midi, dt, tr, 60 / bpm);
      objetivo = apunte.nota;
      desvio = apunte.desvio;
      traza.push({ p: pulsoVoz, m: lectura.midi, ok: desvio !== null && Math.abs(desvio) <= tolerancia() });
      if (traza.length > 1200) traza.splice(0, 300);
    }
    const proxima = objetivo ?? notaEn(voz.notas, pos) ?? siguienteNota(voz.notas, pos);
    if (!suena && proxima && lectura.midi !== null) {
      desvio = calcularDesvio(lectura.midi, proxima.midi + tr, estado.octavas);
    }

    const frase = fraseEnCurso(pos);
    rollo.dibujar({
      pos,
      sonando: suena,
      evaluador,
      traza,
      cantada: lectura.midi,
      desvio,
      objetivo: suena ? objetivo : proxima,
      frase: estado.bucle ? frase : null,
      tolerancia: tolerancia(),
    });

    if (frase.i !== fraseVista) pintarLetra(frase);
    marcarSilaba(pos, frase);

    if (ahora - ultimoTexto > 100) {
      ultimoTexto = ahora;
      pintarMarcador({ objetivo, proxima, desvio, lectura, suena, pos });
    }
  }

  // ── Mandos ──────────────────────────────────────────

  $('selector-cuerda').append(
    ...partitura.voces.map((v) => {
      const etiqueta = elemento('label', `cuerda tinte-${v.tinte}`);
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'cuerda';
      radio.value = v.id;
      radio.addEventListener('change', () => {
        const pos = posicion();
        ponerCuerda(v.id);
        evaluador.reiniciar();
        if (estado.bucle) irA(tramo(voz.frases[indiceBucle]).desde);
        else if (!sonando()) irA(pos);
      });
      const texto = elemento('span');
      texto.append(icono('check'), v.nombre); // la marca solo se ve en la cuerda elegida
      etiqueta.append(radio, texto);
      return etiqueta;
    }),
  );

  $('btn-reproducir').addEventListener('click', alternar);
  $('btn-principio').addEventListener('click', () => irA(estado.bucle ? tramo(voz.frases[indiceBucle]).desde : 0));
  $('btn-oir').addEventListener('click', async () => {
    await encender();
    const pos = posicion();
    const nota = notaEn(voz.notas, pos) ?? siguienteNota(voz.notas, pos);
    if (nota) audio.coro.darNota(nota.midi + estado.transporte);
  });

  $('selector-frase').addEventListener('change', (ev) => {
    indiceBucle = Number(ev.target.value);
    irA(tramo(voz.frases[indiceBucle]).desde);
    aplicarBucle();
  });

  $('chk-bucle').checked = estado.bucle;
  $('chk-bucle').addEventListener('change', (ev) => {
    estado.bucle = ev.target.checked;
    guardar();
    if (estado.bucle) indiceBucle = fraseDe(voz, posicion()).i;
    aplicarBucle();
    $('pasada').hidden = true;
  });

  $('chk-todas').checked = estado.verTodas;
  $('chk-todas').addEventListener('change', (ev) => {
    estado.verTodas = ev.target.checked;
    guardar();
    rollo.configurar({ partitura, voz, verTodas: estado.verTodas, transporte: estado.transporte });
  });

  $('rng-tempo').value = estado.tempo;
  $('rng-tempo').addEventListener('input', (ev) => {
    estado.tempo = Number(ev.target.value);
    guardar();
    if (audio) audio.coro.tempo = estado.tempo;
    pintarTempo();
  });

  for (const radio of $('mi-voz-suena').querySelectorAll('input')) {
    radio.checked = radio.value === estado.miVoz;
    radio.addEventListener('change', () => {
      estado.miVoz = radio.value;
      guardar();
      aplicarMezcla();
    });
  }

  $('chk-claqueta').checked = estado.claqueta;
  $('chk-claqueta').addEventListener('change', (ev) => {
    estado.claqueta = ev.target.checked;
    guardar();
    if (audio) audio.coro.claqueta = estado.claqueta;
  });

  $('btn-tono-menos').addEventListener('click', () => cambiarTono(-1));
  $('btn-tono-mas').addEventListener('click', () => cambiarTono(1));

  $('sel-micro').addEventListener('change', async (ev) => {
    estado.micro = ev.target.value;
    guardar();
    if (audio?.mic.activo) await encenderMicro();
  });

  $('chk-auriculares').checked = estado.auriculares;
  $('chk-auriculares').addEventListener('change', async (ev) => {
    estado.auriculares = ev.target.checked;
    guardar();
    if (audio?.mic.activo) await encenderMicro();
  });

  $('chk-exigente').checked = estado.exigente;
  $('chk-exigente').addEventListener('change', (ev) => {
    estado.exigente = ev.target.checked;
    guardar();
    evaluador.tolerancia = tolerancia();
    $('afinador-zona').style.width = `${(tolerancia() / RANGO_AGUJA) * 100}%`;
  });

  $('chk-octavas').checked = estado.octavas;
  $('chk-octavas').addEventListener('change', (ev) => {
    estado.octavas = ev.target.checked;
    guardar();
    evaluador.aceptarOctavas = estado.octavas;
  });

  document.addEventListener('keydown', (ev) => {
    if (vista.hidden || ev.code !== 'Space' || ev.repeat) return;
    if (ev.target.closest('input, select, button, a, summary, textarea')) return;
    ev.preventDefault();
    alternar();
  });

  ponerCuerda(voz.id);
  pintarTono();
  pintarTempo();
  pintarBoton();
  $('afinador-zona').style.width = `${(tolerancia() / RANGO_AGUJA) * 100}%`;

  return {
    elegirCuerda(id) {
      if (id !== voz.id) {
        ponerCuerda(id);
        irA(0);
      }
    },
    entrar() {
      previo = performance.now();
      fraseVista = -1;
      cuadro = requestAnimationFrame(cuadroNuevo);
      // Si ya se dio permiso antes (por ejemplo en la prueba de voz), el micro se enciende solo.
      if (audioActual()?.ctx.state === 'running') encender();
    },
    salir() {
      cancelAnimationFrame(cuadro);
      audio?.coro.pausar();
      audio?.mic.detener();
    },
  };
}
