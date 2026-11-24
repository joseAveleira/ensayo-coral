// Lleva la cuenta de cómo se ha cantado cada nota de la cuerda elegida.

import { notaEn } from './partitura.js';

export const ESTADO = {
  PENDIENTE: 'pendiente',
  BIEN: 'bien',
  ALTA: 'alta',
  BAJA: 'baja',
  SIN_VOZ: 'sin-voz',
};

const GRACIA = 0.12; // segundos al entrar en la nota que no se juzgan

/** Diferencia en cents entre lo cantado y la nota pedida. */
export function desvio(midiCantado, midiPedido, aceptarOctavas = false) {
  let d = (midiCantado - midiPedido) * 100;
  if (aceptarOctavas) d = ((((d + 600) % 1200) + 1200) % 1200) - 600;
  return d;
}

export class Evaluador {
  constructor(notas, { tolerancia = 50, aceptarOctavas = false } = {}) {
    this.notas = notas;
    this.tolerancia = tolerancia;
    this.aceptarOctavas = aceptarOctavas;
    this.reiniciar();
  }

  reiniciar(desde = -Infinity, hasta = Infinity) {
    this.datos ??= this.notas.map(() => null);
    this.notas.forEach((n, i) => {
      if (n.fin > desde && n.ini < hasta) this.datos[i] = { juzgado: 0, conVoz: 0, afinado: 0, sumaDesvio: 0 };
    });
  }

  /**
   * Apunta una lectura. pulso: posición en la obra; segundosNota: cuánto lleva
   * sonando la nota; midi: lo cantado (o null); dt: duración de la lectura.
   * Devuelve { nota, desvio } de lo que se está juzgando.
   */
  apuntar(pulso, midi, dt, transporte, segundosPorPulso) {
    const nota = notaEn(this.notas, pulso);
    if (!nota) return { nota: null, desvio: null };
    const d = midi === null ? null : desvio(midi, nota.midi + transporte, this.aceptarOctavas);
    if ((pulso - nota.ini) * segundosPorPulso < GRACIA) return { nota, desvio: d };

    const dato = this.datos[nota.i];
    dato.juzgado += dt;
    if (d !== null) {
      dato.conVoz += dt;
      dato.sumaDesvio += d * dt;
      if (Math.abs(d) <= this.tolerancia) dato.afinado += dt;
    }
    return { nota, desvio: d };
  }

  estado(i) {
    const dato = this.datos[i];
    if (!dato || dato.juzgado < 0.05) return ESTADO.PENDIENTE;
    if (dato.conVoz < dato.juzgado * 0.25) return ESTADO.SIN_VOZ;
    if (dato.afinado >= dato.conVoz * 0.5 && dato.afinado >= dato.juzgado * 0.3) return ESTADO.BIEN;
    return dato.sumaDesvio > 0 ? ESTADO.ALTA : ESTADO.BAJA;
  }

  /** Parte de la nota cantada dentro de la tolerancia (0 a 1). */
  acierto(i) {
    const dato = this.datos[i];
    if (!dato || dato.juzgado < 0.05) return 0;
    return dato.afinado / dato.juzgado;
  }

  desvioMedio(i) {
    const dato = this.datos[i];
    return dato && dato.conVoz > 0 ? dato.sumaDesvio / dato.conVoz : 0;
  }

  /** Resumen de las notas entre dos pulsos. */
  resumen(desde = -Infinity, hasta = Infinity) {
    const cuenta = { bien: 0, alta: 0, baja: 0, sinVoz: 0, total: 0 };
    let tiempoJuzgado = 0;
    let tiempoAfinado = 0;
    for (const n of this.notas) {
      if (n.ini < desde || n.ini >= hasta) continue;
      const e = this.estado(n.i);
      if (e === ESTADO.PENDIENTE) continue;
      cuenta.total++;
      if (e === ESTADO.BIEN) cuenta.bien++;
      else if (e === ESTADO.ALTA) cuenta.alta++;
      else if (e === ESTADO.BAJA) cuenta.baja++;
      else cuenta.sinVoz++;
      tiempoJuzgado += this.datos[n.i].juzgado;
      tiempoAfinado += this.datos[n.i].afinado;
    }
    return { ...cuenta, afinacion: tiempoJuzgado ? tiempoAfinado / tiempoJuzgado : 0 };
  }
}
