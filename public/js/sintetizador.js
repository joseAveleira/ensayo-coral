// Motor de sonido: un coro y unas cuerdas sintetizados con Web Audio.
//
// Cada nota son dos osciladores ligeramente desafinados entre sí (da cuerpo de
// conjunto), con un vibrato suave, un filtro por cuerda y una reverberación de
// iglesia generada al vuelo. No hay grabaciones: todo se calcula en el momento.

const ARMONICOS_VOZ = [0, 1, 0.5, 0.28, 0.14, 0.09, 0.05, 0.03, 0.015];
const ARMONICOS_CUERDA = [0, 1, 0.62, 0.42, 0.3, 0.2, 0.13, 0.09, 0.06, 0.04, 0.03];

// Colocación de cada cuerda en el estéreo y brillo de su timbre.
const AJUSTES = {
  soprano: { pan: -0.4, corte: 3000 },
  contralto: { pan: -0.15, corte: 2500 },
  tenor: { pan: 0.15, corte: 2100 },
  bajo: { pan: 0.4, corte: 1600 },
};

function crearSala(ctx, segundos = 2.8) {
  const n = Math.floor(ctx.sampleRate * segundos);
  const retardo = Math.floor(ctx.sampleRate * 0.018);
  const sala = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let canal = 0; canal < 2; canal++) {
    const datos = sala.getChannelData(canal);
    let previo = 0;
    for (let i = retardo; i < n; i++) {
      const t = (i - retardo) / (n - retardo);
      const ruido = Math.random() * 2 - 1;
      previo += (ruido - previo) * (0.6 - 0.45 * t); // la sala se apaga antes en los agudos
      datos[i] = previo * Math.exp(-5.5 * t);
    }
  }
  return sala;
}

function crearOnda(ctx, armonicos) {
  return ctx.createPeriodicWave(new Float32Array(armonicos.length), new Float32Array(armonicos));
}

export class Coro extends EventTarget {
  constructor(ctx, partitura) {
    super();
    this.ctx = ctx;
    this.partitura = partitura;
    this.total = partitura.total;
    this.bpm = partitura.tempo;
    this.transporte = 0;
    this.sonando = false;
    this.bucle = null; // { desde, hasta } en pulsos
    this.claqueta = false;

    this._posPausa = 0;
    this._anclaPulso = 0;
    this._anclaReloj = 0;
    this._vivas = new Set();
    this._temporizador = null;
    this._proximoClic = 0;

    // Salida: mezcla -> (directo + reverberación) -> compresor -> altavoces
    this.salida = ctx.createGain();
    this.salida.gain.value = 1.6;
    const compresor = ctx.createDynamicsCompressor();
    compresor.threshold.value = -16;
    compresor.ratio.value = 3;
    compresor.attack.value = 0.01;
    compresor.release.value = 0.25;
    this.salida.connect(compresor).connect(ctx.destination);

    this.mezcla = ctx.createGain();
    this.mezcla.connect(this.salida);
    const sala = ctx.createConvolver();
    sala.buffer = crearSala(ctx);
    const humedo = ctx.createGain();
    humedo.gain.value = 0.32;
    this.mezcla.connect(sala).connect(humedo).connect(this.salida);

    const ondaVoz = crearOnda(ctx, ARMONICOS_VOZ);
    const ondaCuerda = crearOnda(ctx, ARMONICOS_CUERDA);

    this.partes = new Map();
    partitura.voces.forEach((voz, i) => {
      const reparto = AJUSTES[voz.id] ?? { pan: -0.4 + (0.8 * i) / Math.max(1, partitura.voces.length - 1), corte: 2400 };
      this._crearParte(voz.id, voz.notas, ondaVoz, reparto, { vibrato: 5, nivel: 0.11, ataque: 0.09 });
    });
    for (const a of partitura.acompanamiento) {
      this._crearParte(a.id, a.notas, ondaCuerda, { pan: 0, corte: 3400 }, { vibrato: 3, nivel: 0.075, ataque: 0.06 });
    }
    // Parte sin notas, para dar el tono de referencia.
    this._crearParte('guia', [], ondaVoz, { pan: 0, corte: 2600 }, { vibrato: 0, nivel: 0.2, ataque: 0.04 });
  }

  _crearParte(id, notas, onda, { pan, corte }, { vibrato, nivel, ataque }) {
    const ctx = this.ctx;
    const ganancia = ctx.createGain();
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = corte;
    filtro.Q.value = 0.4;
    const panorama = ctx.createStereoPanner();
    panorama.pan.value = pan;
    ganancia.connect(filtro).connect(panorama).connect(this.mezcla);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 4.8 + Math.random() * 0.8;
    const profundidad = ctx.createGain();
    profundidad.gain.value = vibrato;
    lfo.connect(profundidad);
    lfo.start();

    this.partes.set(id, { id, notas, onda, ganancia, vibrato: profundidad, nivel, ataque, indice: 0, volumen: 1 });
  }

  /** Retraso entre que se programa un sonido y se oye (segundos). */
  get latencia() {
    return (this.ctx.outputLatency || 0) + (this.ctx.baseLatency || 0);
  }

  /** Posición actual en pulsos (negras desde el principio). */
  get posicion() {
    if (!this.sonando) return this._posPausa;
    return this._anclaPulso + ((this.ctx.currentTime - this._anclaReloj) * this.bpm) / 60;
  }

  /** Posición de lo que se está oyendo ahora mismo, descontada la latencia. */
  get posicionOida() {
    if (!this.sonando) return this._posPausa;
    return this.posicion - (this.latencia * this.bpm) / 60;
  }

  set tempo(bpm) {
    if (this.sonando) {
      this._anclaPulso = this.posicion;
      this._anclaReloj = this.ctx.currentTime;
    }
    this.bpm = bpm;
  }

  get tempo() {
    return this.bpm;
  }

  volumen(id, valor) {
    const parte = this.partes.get(id);
    if (!parte) return;
    parte.volumen = valor;
    parte.ganancia.gain.setTargetAtTime(valor, this.ctx.currentTime, 0.03);
  }

  async reproducir() {
    if (this.sonando) return;
    await this.ctx.resume();
    if (this._posPausa >= this.total) this._posPausa = this.bucle ? this.bucle.desde : 0;
    this._colocar(this._posPausa);
    this.sonando = true;
    this._temporizador = setInterval(() => this._tic(), 25);
    this._tic();
    this.dispatchEvent(new Event('estado'));
  }

  pausar() {
    if (!this.sonando) return;
    this._posPausa = Math.max(0, this.posicion);
    this.sonando = false;
    clearInterval(this._temporizador);
    this._callar();
    this.dispatchEvent(new Event('estado'));
  }

  ir(pulso) {
    const destino = Math.min(Math.max(0, pulso), this.total);
    if (this.sonando) this._colocar(destino);
    else this._posPausa = destino;
  }

  /** Toca una nota suelta de referencia. */
  async darNota(midi, segundos = 1.6) {
    await this.ctx.resume();
    const ahora = this.ctx.currentTime + 0.03;
    this._nota(this.partes.get('guia'), midi, ahora, ahora + segundos, false);
  }

  _tiempoDe(pulso) {
    return this._anclaReloj + ((pulso - this._anclaPulso) * 60) / this.bpm;
  }

  _colocar(pulso) {
    this._callar();
    this._anclaPulso = pulso;
    this._anclaReloj = this.ctx.currentTime + 0.08;
    for (const parte of this.partes.values()) {
      let i = 0;
      while (i < parte.notas.length && parte.notas[i].fin <= pulso) i++;
      parte.indice = i;
    }
    this._proximoClic = Math.ceil(pulso - 1e-6);
  }

  _callar() {
    const ahora = this.ctx.currentTime;
    for (const viva of this._vivas) {
      viva.env.gain.cancelScheduledValues(ahora);
      viva.env.gain.setTargetAtTime(0, ahora, 0.025);
      for (const osc of viva.oscs) {
        try {
          osc.stop(ahora + 0.2);
        } catch {
          /* ya estaba parado */
        }
      }
    }
    this._vivas.clear();
  }

  _tic() {
    if (!this.sonando) return;
    const ahora = this.ctx.currentTime;
    let pos = this.posicion;

    if (this.bucle && pos >= this.bucle.hasta) {
      this._colocar(this.bucle.desde);
      pos = this.bucle.desde;
      this.dispatchEvent(new Event('vuelta'));
    } else if (pos >= this.total + 0.5) {
      this.sonando = false;
      this._posPausa = this.total;
      clearInterval(this._temporizador);
      this.dispatchEvent(new Event('estado'));
      this.dispatchEvent(new Event('fin'));
      return;
    }

    // Con la pestaña en segundo plano el navegador despierta poco: se programa más lejos.
    const margen = document.hidden ? 1.6 : 0.25;
    let limite = pos + (margen * this.bpm) / 60;
    // En una repetición no se empiezan notas pasado el corte: las que suenan
    // terminan solas y queda un respiro antes de volver.
    if (this.bucle) limite = Math.min(limite, this.bucle.corte ?? this.bucle.hasta);

    for (const parte of this.partes.values()) {
      const notas = parte.notas;
      while (parte.indice < notas.length && notas[parte.indice].ini < limite) {
        const nota = notas[parte.indice++];
        const tIni = Math.max(ahora, this._tiempoDe(nota.ini));
        const tFin = this._tiempoDe(nota.fin);
        if (tFin - tIni > 0.04) this._nota(parte, nota.midi, tIni, tFin, true);
      }
    }

    if (this.claqueta) {
      while (this._proximoClic < limite) {
        const t = this._tiempoDe(this._proximoClic);
        if (t >= ahora) this._clic(t, this._proximoClic % this.partitura.pulsosPorCompas === 0);
        this._proximoClic += 1;
      }
    }
  }

  _nota(parte, midi, tIni, tFin, transportar) {
    const ctx = this.ctx;
    const altura = midi + (transportar ? this.transporte : 0);
    const frecuencia = 440 * 2 ** ((altura - 69) / 12);
    const ataque = Math.min(parte.ataque, (tFin - tIni) * 0.3);
    const cola = 0.07;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, tIni);
    env.gain.linearRampToValueAtTime(parte.nivel, tIni + ataque);
    env.gain.setTargetAtTime(parte.nivel * 0.8, tIni + ataque, 0.35);
    env.gain.setTargetAtTime(0, Math.max(tIni + ataque, tFin - 0.05), cola);
    env.connect(parte.ganancia);

    const oscs = [-5, 5].map((desafinado) => {
      const osc = ctx.createOscillator();
      osc.setPeriodicWave(parte.onda);
      osc.frequency.value = frecuencia;
      osc.detune.value = desafinado;
      parte.vibrato.connect(osc.detune);
      osc.connect(env);
      osc.start(tIni);
      osc.stop(tFin + cola * 6);
      return osc;
    });

    const viva = { env, oscs };
    this._vivas.add(viva);
    oscs[0].onended = () => {
      env.disconnect();
      this._vivas.delete(viva);
    };
  }

  _clic(t, fuerte) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.value = fuerte ? 1500 : 1000;
    env.gain.setValueAtTime(fuerte ? 0.3 : 0.18, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(env).connect(this.salida);
    osc.start(t);
    osc.stop(t + 0.06);
  }
}
