// Micrófono y detección de tono.
//
// El tono se calcula con el algoritmo YIN (de Cheveigné y Kawahara, 2002) sobre
// la forma de onda que entrega el navegador: se busca el desfase en el que la
// señal mejor se parece a sí misma, y ese desfase es el periodo de la nota.

export const frecuenciaAMidi = (f) => 69 + 12 * Math.log2(f / 440);
export const midiAFrecuencia = (m) => 440 * 2 ** ((m - 69) / 12);

export class DetectorTono {
  constructor(frecuenciaMuestreo, tam = 2048, { fMin = 62, fMax = 1175, umbral = 0.15 } = {}) {
    this.fs = frecuenciaMuestreo;
    this.tam = tam;
    this.tauMin = Math.max(2, Math.floor(this.fs / fMax));
    this.tauMax = Math.min(Math.floor(this.fs / fMin), tam >> 1);
    this.ventana = tam - this.tauMax;
    this.d = new Float32Array(this.tauMax + 2);
    this.umbral = umbral;
  }

  /** Devuelve { f, claridad, rms }. f vale 0 cuando no hay una nota clara. */
  detectar(x) {
    const { tam, d, ventana, tauMin, tauMax } = this;

    let energia = 0;
    for (let i = 0; i < tam; i++) energia += x[i] * x[i];
    const rms = Math.sqrt(energia / tam);
    if (rms < 0.004) return { f: 0, claridad: 0, rms };

    // Diferencia normalizada por la media acumulada.
    d[0] = 1;
    let acumulado = 0;
    for (let tau = 1; tau <= tauMax; tau++) {
      let suma = 0;
      for (let j = 0; j < ventana; j++) {
        const dif = x[j] - x[j + tau];
        suma += dif * dif;
      }
      acumulado += suma;
      d[tau] = acumulado > 0 ? (suma * tau) / acumulado : 1;
    }

    // Primer valle por debajo del umbral (evita saltar a la octava grave).
    let tau = -1;
    for (let t = tauMin; t < tauMax; t++) {
      if (d[t] < this.umbral) {
        while (t + 1 < tauMax && d[t + 1] < d[t]) t++;
        tau = t;
        break;
      }
    }
    if (tau < 0) {
      let minimo = 1;
      for (let t = tauMin; t < tauMax; t++) {
        if (d[t] < minimo) {
          minimo = d[t];
          tau = t;
        }
      }
      if (minimo > 0.3 || tau < 0) return { f: 0, claridad: 1 - minimo, rms };
    }

    // Afinado fino con una parábola entre los tres puntos vecinos.
    let tauFino = tau;
    if (tau > 1 && tau < tauMax) {
      const a = d[tau - 1];
      const b = d[tau];
      const c = d[tau + 1];
      const curvatura = a + c - 2 * b;
      if (curvatura > 0) tauFino = tau + (a - c) / (2 * curvatura);
    }
    return { f: this.fs / tauFino, claridad: 1 - d[tau], rms };
  }
}

export class Microfono {
  constructor(ctx) {
    this.ctx = ctx;
    this.activo = false;
    this.cancelarEco = false;
    this._recientes = [];
  }

  /**
   * Pide permiso y conecta el micrófono.
   * cancelarEco = true cuando se canta con altavoces en vez de auriculares.
   */
  async iniciar({ cancelarEco = false, dispositivo = null } = {}) {
    if (!navigator.mediaDevices?.getUserMedia) {
      const error = new Error('Este navegador no permite usar el micrófono.');
      error.name = 'SinSoporte';
      throw error;
    }
    this.detener();
    this.cancelarEco = cancelarEco;
    this.flujo = await navigator.mediaDevices.getUserMedia({
      audio: {
        ...(dispositivo ? { deviceId: { exact: dispositivo } } : {}),
        echoCancellation: cancelarEco,
        noiseSuppression: false,
        autoGainControl: true,
        channelCount: 1,
      },
      video: false,
    });
    const ctx = this.ctx;
    this.fuente = ctx.createMediaStreamSource(this.flujo);
    this.filtro = ctx.createBiquadFilter();
    this.filtro.type = 'highpass';
    this.filtro.frequency.value = 55;
    this.analizador = ctx.createAnalyser();
    this.analizador.fftSize = ctx.sampleRate > 50000 ? 4096 : 2048;
    this.fuente.connect(this.filtro).connect(this.analizador);
    this.muestras = new Float32Array(this.analizador.fftSize);
    this.detector = new DetectorTono(ctx.sampleRate, this.analizador.fftSize);
    this._recientes = [];
    this.activo = true;
  }

  detener() {
    this.flujo?.getTracks().forEach((pista) => pista.stop());
    this.fuente?.disconnect();
    this.filtro?.disconnect();
    this.flujo = this.fuente = this.filtro = this.analizador = null;
    this.activo = false;
    this._recientes = [];
  }

  /** Retraso aproximado entre que suena la voz y sale la lectura (segundos). */
  get retraso() {
    if (!this.analizador) return 0.05;
    return this.analizador.fftSize / this.ctx.sampleRate / 2 + 0.02;
  }

  /**
   * Lectura instantánea: { midi, f, claridad, nivel }.
   * midi es null si no se oye una nota clara; nivel va de 0 a 1.
   */
  leer() {
    if (!this.activo) return { midi: null, f: 0, claridad: 0, nivel: 0 };
    this.analizador.getFloatTimeDomainData(this.muestras);
    const { f, claridad, rms } = this.detector.detectar(this.muestras);
    const nivel = Math.min(1, Math.max(0, (20 * Math.log10(rms + 1e-7) + 60) / 54));

    let midi = null;
    if (f > 0 && claridad >= 0.8 && rms >= 0.006) midi = frecuenciaAMidi(f);

    // Mediana de las tres últimas lecturas: quita saltos sueltos de octava.
    const recientes = this._recientes;
    recientes.push(midi);
    if (recientes.length > 3) recientes.shift();
    if (midi !== null) {
      const validas = recientes.filter((v) => v !== null).sort((a, b) => a - b);
      if (validas.length === 3) midi = validas[1];
    }
    return { midi, f, claridad, nivel };
  }
}
