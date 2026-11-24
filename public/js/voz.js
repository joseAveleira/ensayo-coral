// Vista «Mi voz»: mide la nota más grave y la más aguda y dice qué cuerda encaja.

import { nombreNota, encaje } from './partitura.js';
import { obtenerAudio, explicarErrorMicro } from './audio.js';
import { Ventanal } from './ventanal.js';

const $ = (id) => document.getElementById(id);
const plural = (n, uno, varios) => (n === 1 ? uno : varios);

function enumerar(nombres) {
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** Texto del veredicto de una cuerda para una voz medida. */
function veredicto(e) {
  if (e.dentro === e.total) {
    return { corto: 'Llegas a todas', largo: `Sus ${e.total} notas te quedan dentro.`, pleno: true };
  }
  const faltas = [];
  if (e.fueraAgudas.length) faltas.push(`${e.fueraAgudas.length} ${plural(e.fueraAgudas.length, 'aguda', 'agudas')}`);
  if (e.fueraGraves.length) faltas.push(`${e.fueraGraves.length} ${plural(e.fueraGraves.length, 'grave', 'graves')}`);
  const cuantas = e.fueraAgudas.length + e.fueraGraves.length;
  const corto = `${plural(cuantas, 'Te falta', 'Te faltan')} ${faltas.join(' y ')}`;

  let largo;
  if (cuantas <= 3) {
    largo = `${enumerar([...e.fueraGraves, ...e.fueraAgudas].map((a) => nombreNota(a.midi)))}.`;
  } else {
    largo = `Llegas a ${e.dentro} de ${e.total}.`;
  }
  if (e.ajuste !== null && Math.abs(e.ajuste) <= 4) {
    const n = Math.abs(e.ajuste);
    largo += ` Con la obra ${n} ${plural(n, 'semitono', 'semitonos')} más ${e.ajuste < 0 ? 'grave' : 'aguda'}, llegarías.`;
  }
  return { corto, largo, pleno: false };
}

export function iniciarVoz({ partitura, estado, guardar, elegirCuerda }) {
  const vista = document.querySelector('.vista--voz');
  const ventanal = new Ventanal($('ventanal-dibujo'), partitura);
  const pasos = [...document.querySelectorAll('.prueba__paso')];
  const aviso = $('prueba-aviso');

  let paso = 'reposo'; // reposo | grave | aguda | hecho
  let medida = { grave: null, aguda: null };
  let muestras = [];
  let mic = null;
  let cuadro = null;
  let ultimoTexto = 0;

  function ponerPaso(nuevo) {
    paso = nuevo;
    const para = nuevo === 'grave' || nuevo === 'aguda' ? 'midiendo' : nuevo;
    for (const el of pasos) el.hidden = el.dataset.para !== para;
    vista.dataset.fase = para; // en pantallas estrechas, al medir mandan los ventanales

    if (nuevo === 'grave') {
      $('prueba-titulo').textContent = 'Primero, tu nota más grave';
      $('prueba-ayuda').textContent = 'Di «aaa» y ve bajando poco a poco, como una sirena. Cuando llegues a la más grave que te salga cómoda, mantenla un segundo.';
      $('prueba-rotulo').textContent = 'La más grave hasta ahora';
      $('btn-siguiente').textContent = 'Listo, siguiente';
    } else if (nuevo === 'aguda') {
      $('prueba-titulo').textContent = 'Ahora, la más aguda';
      $('prueba-ayuda').textContent = 'Sube poco a poco hasta la nota más aguda que te salga sin forzar y mantenla un segundo.';
      $('prueba-rotulo').textContent = 'La más aguda hasta ahora';
      $('btn-siguiente').textContent = 'Listo, ver resultado';
    }
    if (para === 'midiendo') {
      $('prueba-marca').textContent = 'ninguna';
      $('prueba-nota').textContent = '—';
      $('btn-siguiente').disabled = true;
      muestras = [];
      $('prueba-titulo').focus({ preventScroll: true });
    }
  }

  function calcular(voz) {
    const encajes = partitura.voces.map((v) => encaje(v, voz.grave, voz.aguda));
    const orden = [...encajes].sort(
      (a, b) => (b.dentro === b.total) - (a.dentro === a.total) || b.cobertura - a.cobertura || b.holgura - a.holgura,
    );
    return { encajes, mejor: orden[0] };
  }

  function pintarFichas() {
    const voz = estado.voz;
    const calculo = voz ? calcular(voz) : null;
    const fichas = partitura.voces.map((v, i) => {
      const ficha = document.createElement('article');
      ficha.className = `ficha tinte-${v.tinte}`;
      const esMejor = calculo?.mejor.voz === v;
      ficha.classList.toggle('es-mejor', Boolean(esMejor));

      const nombre = document.createElement('h3');
      nombre.className = 'ficha__nombre';
      nombre.textContent = v.nombre;
      const rango = document.createElement('p');
      rango.className = 'ficha__rango';
      rango.textContent = `${nombreNota(v.min)} a ${nombreNota(v.max)}`;
      ficha.append(nombre, rango);

      if (calculo) {
        const texto = veredicto(calculo.encajes[i]);
        const corto = document.createElement('p');
        corto.className = 'ficha__veredicto';
        corto.textContent = texto.corto;
        const largo = document.createElement('p');
        largo.className = 'ficha__detalle';
        largo.textContent = texto.largo;
        ficha.append(corto, largo);
      }

      const boton = document.createElement('a');
      boton.className = `boton boton--chico ${esMejor ? 'boton--principal' : 'boton--secundario'}`;
      boton.href = '#ensayo';
      boton.textContent = 'Ensayar';
      boton.setAttribute('aria-label', `Ensayar ${v.nombre}`);
      boton.addEventListener('click', () => elegirCuerda(v.id));
      ficha.append(boton);
      return ficha;
    });
    $('fichas').replaceChildren(...fichas);

    // Sobre cada ventanal, el nombre de su cuerda; la que mejor encaja lo dice con palabras.
    $('nombres').replaceChildren(
      ...partitura.voces.map((v) => {
        const nombre = document.createElement('div');
        nombre.className = `nombre tinte-${v.tinte}`;
        if (calculo?.mejor.voz === v) {
          const banderola = document.createElement('span');
          banderola.className = 'banderola';
          banderola.textContent = 'Tu cuerda';
          nombre.append(banderola);
        }
        const texto = document.createElement('span');
        texto.textContent = v.nombre;
        nombre.append(texto);
        return nombre;
      }),
    );
    return calculo;
  }

  function pintarResultado(animar) {
    const voz = estado.voz;
    const calculo = pintarFichas();
    ventanal.ponerVoz(voz, calculo?.mejor.voz.id ?? null, animar);
    if (!voz) return null;

    const [grave, aguda] = $('res-rango').querySelectorAll('strong');
    grave.textContent = nombreNota(voz.grave);
    aguda.textContent = nombreNota(voz.aguda);

    const mejor = calculo.mejor;
    const consejo = $('res-consejo');
    const boton = $('btn-ensayar-mejor');
    $('res-rango').className = `resultado tinte-${mejor.voz.tinte}`;
    if (mejor.dentro === mejor.total) {
      consejo.textContent = `La cuerda que mejor te va es ${mejor.voz.nombre}: llegas a sus ${mejor.total} notas.`;
    } else {
      const texto = veredicto(mejor);
      consejo.textContent = `Ninguna cuerda te entra entera. La más cercana es ${mejor.voz.nombre}: ${texto.corto.toLowerCase()}. ${texto.largo}`;
    }
    boton.textContent = `Ensayar ${mejor.voz.nombre}`;
    boton.onclick = () => elegirCuerda(mejor.voz.id);
    return calculo;
  }

  function detenerMedicion() {
    cancelAnimationFrame(cuadro);
    cuadro = null;
    mic?.detener();
    ventanal.rayo(null);
    $('prueba-nivel').style.transform = 'scaleX(0)';
  }

  /** Una nota cuenta cuando se sostiene estable al menos un tercio de segundo. */
  function notaEstable(midi, ahora) {
    if (midi === null) {
      muestras = [];
      return null;
    }
    muestras.push({ t: ahora, midi });
    while (muestras.length && ahora - muestras[0].t > 420) muestras.shift();
    if (ahora - muestras[0].t < 320) return null;
    const valores = muestras.map((m) => m.midi).sort((a, b) => a - b);
    if (valores[valores.length - 1] - valores[0] > 1) return null;
    return Math.round(valores[valores.length >> 1]);
  }

  function medir() {
    cuadro = requestAnimationFrame(medir);
    const ahora = performance.now();
    const lectura = mic.leer();
    $('prueba-nivel').style.transform = `scaleX(${lectura.nivel.toFixed(3)})`;
    ventanal.rayo(lectura.midi);

    if (ahora - ultimoTexto > 110) {
      ultimoTexto = ahora;
      $('prueba-nota').textContent = lectura.midi === null ? '—' : nombreNota(lectura.midi);
    }

    const estable = notaEstable(lectura.midi, ahora);
    if (estable === null) return;
    const anterior = medida[paso];
    const mejora = anterior === null || (paso === 'grave' ? estable < anterior : estable > anterior);
    if (!mejora) return;
    medida[paso] = estable;
    $('prueba-marca').textContent = nombreNota(estable);
    $('btn-siguiente').disabled = false;
    ventanal.marcar(paso, estable);
  }

  async function empezar() {
    aviso.hidden = true;
    try {
      const audio = obtenerAudio(partitura);
      mic = audio.mic;
      await mic.iniciar({ cancelarEco: false, dispositivo: estado.micro || null });
    } catch (error) {
      aviso.textContent = explicarErrorMicro(error);
      aviso.hidden = false;
      return;
    }
    medida = { grave: null, aguda: null };
    ventanal.ponerVoz(null, null, false);
    $('fichas').querySelectorAll('.ficha__veredicto, .ficha__detalle').forEach((el) => el.remove());
    $('nombres').querySelectorAll('.banderola').forEach((el) => el.remove());
    ponerPaso('grave');
    encuadrar();
    cuadro = requestAnimationFrame(medir);
  }

  /**
   * En pantallas estrechas la lectura queda fija al pie y tapa parte de los
   * ventanales: se lleva a la vista la mitad que importa en cada paso
   * (abajo para la nota grave, arriba para la aguda).
   */
  function encuadrar() {
    if (!window.matchMedia('(max-width: 960px)').matches) return;
    setTimeout(() => {
      const dibujo = $('ventanal-dibujo').getBoundingClientRect();
      const bloque = vista.querySelector('.voz__texto').getBoundingClientRect();
      const salto = paso === 'grave' ? dibujo.bottom - bloque.top + 10 : $('nombres').getBoundingClientRect().top - 8;
      window.scrollBy({ top: salto, behavior: 'smooth' });
    }, 60);
  }

  function siguiente() {
    if (paso === 'grave') {
      ponerPaso('aguda');
      encuadrar();
      return;
    }
    if (medida.aguda - medida.grave < 5) {
      aviso.textContent = 'Entre tu nota grave y la aguda hay muy poca distancia; seguramente no te he oído bien. Prueba otra vez, más cerca del micrófono.';
      aviso.hidden = false;
      medida.aguda = null;
      ventanal.marcar('aguda', null);
      ponerPaso('aguda');
      return;
    }
    aviso.hidden = true;
    detenerMedicion();
    estado.voz = { grave: medida.grave, aguda: medida.aguda };
    guardar();
    ponerPaso('hecho');
    const calculo = pintarResultado(true);
    elegirCuerda(calculo.mejor.voz.id);
    $('res-rango').focus({ preventScroll: true });
  }

  function borrar() {
    medida[paso] = null;
    ventanal.marcar(paso, null);
    ponerPaso(paso);
  }

  function cancelar() {
    detenerMedicion();
    aviso.hidden = true;
    ponerPaso(estado.voz ? 'hecho' : 'reposo');
    pintarResultado(false);
  }

  $('btn-probar').addEventListener('click', empezar);
  $('btn-repetir').addEventListener('click', empezar);
  $('btn-siguiente').addEventListener('click', siguiente);
  $('btn-borrar').addEventListener('click', borrar);
  $('btn-cancelar').addEventListener('click', cancelar);

  ponerPaso(estado.voz ? 'hecho' : 'reposo');
  pintarResultado(false);

  return {
    entrar() {},
    salir() {
      if (paso === 'grave' || paso === 'aguda') cancelar();
    },
  };
}
