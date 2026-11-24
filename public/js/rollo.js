// La partitura en movimiento: las notas pasan de derecha a izquierda y la voz
// del cantor se dibuja como una línea de luz en el punto donde suena la música.

import { nombreNota, esNatural } from './partitura.js';
import { ESTADO } from './evaluacion.js';

const CANAL = 70; // columna de nombres de nota
const CABECERA = 30; // franja de números de compás
const PIE = 8;
const BLANCO = '#fff';

export class Rollo {
  constructor(lienzo) {
    this.lienzo = lienzo;
    this.c = lienzo.getContext('2d');
    this.ancho = 0;
    this.alto = 0;
    this.col = null;
    new ResizeObserver(() => this._medir()).observe(lienzo);
    this._medir();
  }

  configurar({ partitura, voz, verTodas, transporte }) {
    this.partitura = partitura;
    this.voz = voz;
    this.verTodas = verTodas;
    this.transporte = transporte;
    if (verTodas) {
      this.lo = partitura.min - 2;
      this.hi = partitura.max + 2;
    } else {
      this.lo = voz.min - 2;
      this.hi = voz.max + 2;
    }
    this._leerColores();
  }

  _medir() {
    const caja = this.lienzo.getBoundingClientRect();
    if (!caja.width || !caja.height) return;
    const escala = Math.min(window.devicePixelRatio || 1, 2);
    this.ancho = caja.width;
    this.alto = caja.height;
    this.lienzo.width = Math.round(caja.width * escala);
    this.lienzo.height = Math.round(caja.height * escala);
    this.c.setTransform(escala, 0, 0, escala, 0, 0);
    this._leerColores();
  }

  _leerColores() {
    const estilo = getComputedStyle(this.lienzo);
    const v = (nombre) => estilo.getPropertyValue(nombre).trim();
    const tinte = (t) => ({ luz: v(`--${t}`), apagado: v(`--${t}-apagado`) });
    this.col = {
      vano: v('--vano'),
      fila: v('--vano-fila'),
      claro: v('--vano-claro'),
      luz: v('--luz'),
      plomo: v('--plomo'),
      tintes: { rubi: tinte('rubi'), ambar: tinte('ambar'), esmeralda: tinte('esmeralda'), cobalto: tinte('cobalto') },
    };
    this.fuente = estilo.fontFamily;
  }

  _letra(px, peso = 600) {
    return `${peso} ${px}px ${this.fuente}`;
  }

  /**
   * e: { pos, sonando, evaluador, traza, cantada, desvio, objetivo, frase, tolerancia }
   */
  dibujar(e) {
    const { c, col, voz, partitura } = this;
    const W = this.ancho;
    const H = this.alto;
    if (!W || !H || !voz || !col) return;

    const tr = this.transporte;
    const lo = this.lo + tr;
    const hi = this.hi + tr;
    const filas = hi - lo + 1;
    const altoFila = (H - CABECERA - PIE) / filas;
    const ppp = Math.min(130, Math.max(54, (W - CANAL) / 9)); // píxeles por pulso
    const xCabezal = CANAL + (W - CANAL) * 0.3;
    const xDe = (pulso) => xCabezal + (pulso - e.pos) * ppp;
    const yDe = (midi) => CABECERA + (hi - midi + 0.5) * altoFila;
    const pIzq = e.pos - (xCabezal - CANAL) / ppp;
    const pDer = e.pos + (W - xCabezal) / ppp;
    const propio = col.tintes[voz.tinte];
    const ppc = partitura.pulsosPorCompas;

    // Fondo: las notas naturales, un punto más claras (como las teclas blancas)
    c.fillStyle = col.vano;
    c.fillRect(0, 0, W, H);
    c.fillStyle = col.fila;
    for (let m = lo; m <= hi; m++) {
      if (esNatural(m)) c.fillRect(CANAL, yDe(m) - altoFila / 2, W - CANAL, altoFila);
    }

    // La fila de la nota que toca
    if (e.objetivo) {
      c.globalAlpha = 0.2;
      c.fillStyle = propio.luz;
      c.fillRect(CANAL, yDe(e.objetivo.midi + tr) - altoFila / 2, W - CANAL, altoFila);
      c.globalAlpha = 1;
    }

    // Compases
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    c.font = this._letra(15, 700);
    for (let b = Math.max(0, Math.floor(pIzq / ppc)); b * ppc <= Math.min(pDer, partitura.total); b++) {
      const x = Math.round(xDe(b * ppc));
      if (x < CANAL - 30) continue;
      c.fillStyle = col.claro;
      c.fillRect(x - 1, 0, 2, H);
      if (b < partitura.compases) {
        c.fillStyle = col.luz;
        c.fillText(String(b + 1), x + 8, 21);
      }
    }

    // Las otras voces: finas, y encendidas mientras suenan
    if (this.verTodas) {
      const h = Math.max(4, Math.min(altoFila * 0.5, 10));
      for (const otra of partitura.voces) {
        if (otra === voz) continue;
        const tinte = col.tintes[otra.tinte];
        for (const n of otra.notas) {
          if (n.fin < pIzq || n.ini > pDer) continue;
          const suena = e.sonando && n.ini <= e.pos && e.pos < n.fin;
          c.fillStyle = suena ? tinte.luz : tinte.apagado;
          c.globalAlpha = suena ? 0.95 : 0.8;
          c.fillRect(xDe(n.ini) + 1.5, yDe(n.midi + tr) - h / 2, n.dur * ppp - 3, h);
        }
      }
      c.globalAlpha = 1;
    }

    // La cuerda propia
    const h = Math.max(7, Math.min(altoFila - 2, 30));
    const tamLetra = Math.max(14, Math.min(h * 0.78, 17));
    for (const n of voz.notas) {
      if (n.fin < pIzq - 1 || n.ini > pDer) continue;
      const x = xDe(n.ini) + 1.5;
      const w = n.dur * ppp - 3;
      const y = yDe(n.midi + tr) - h / 2;
      const estado = e.evaluador.estado(n.i);
      const pasada = n.fin <= e.pos;
      const actual = n.ini <= e.pos && e.pos < n.fin;
      const encendida = pasada && estado === ESTADO.BIEN;

      if (encendida) {
        c.shadowColor = propio.luz;
        c.shadowBlur = 14;
      }
      c.fillStyle = encendida ? propio.luz : propio.apagado;
      this._caja(x, y, w, h, 2.5);
      c.fill();
      c.shadowBlur = 0;

      if (actual) {
        // Se va encendiendo el trozo que se canta afinado
        c.save();
        this._caja(x, y, w, h, 2.5);
        c.clip();
        c.fillStyle = propio.luz;
        let desde = null;
        let previo = null;
        for (const m of e.traza) {
          const vale = m.ok && m.p >= n.ini && m.p < n.fin && (previo === null || m.p - previo < 0.3);
          if (vale) {
            if (desde === null) desde = m.p;
            previo = m.p;
          } else if (desde !== null) {
            c.fillRect(xDe(desde) - 1, y, xDe(previo) - xDe(desde) + 2, h);
            desde = previo = null;
          }
        }
        if (desde !== null) c.fillRect(xDe(desde) - 1, y, xDe(previo) - xDe(desde) + 2, h);
        c.restore();
        c.strokeStyle = col.luz;
        c.lineWidth = 2;
        this._caja(x, y, w, h, 2.5);
        c.stroke();
      }

      // Flecha de corrección en las notas que no salieron
      let sangria = 6;
      if (pasada && (estado === ESTADO.ALTA || estado === ESTADO.BAJA) && w > 20 && h >= 10) {
        this._flecha(x + 11, y + h / 2, Math.min(h * 0.32, 6), estado === ESTADO.BAJA ? -1 : 1, col.luz);
        sangria = 22;
      }

      if (n.silaba) {
        c.font = this._letra(tamLetra, 700);
        const anchoTexto = c.measureText(n.silaba).width;
        if (h >= 15 && anchoTexto <= w - sangria - 4) {
          c.textBaseline = 'middle';
          if (encendida) {
            c.fillStyle = col.plomo;
          } else {
            c.lineWidth = 3;
            c.strokeStyle = actual ? col.vano : propio.apagado;
            c.strokeText(n.silaba, x + sangria, y + h / 2 + 1);
            c.fillStyle = BLANCO;
          }
          c.fillText(n.silaba, x + sangria, y + h / 2 + 1);
        } else {
          c.textBaseline = 'top';
          c.fillStyle = col.luz;
          c.globalAlpha = pasada ? 0.75 : 1;
          c.fillText(n.silaba, x + 1, y + h + 3);
          c.globalAlpha = 1;
        }
      }
    }

    // Fuera de la frase que se repite, todo queda en penumbra
    if (e.frase) {
      c.fillStyle = col.vano;
      c.globalAlpha = 0.6;
      const x1 = xDe(e.frase.desde);
      const x2 = xDe(e.frase.hasta);
      if (x1 > CANAL) c.fillRect(CANAL, CABECERA, x1 - CANAL, H - CABECERA);
      if (x2 < W) c.fillRect(Math.max(CANAL, x2), CABECERA, W - Math.max(CANAL, x2), H - CABECERA);
      c.globalAlpha = 1;
    }

    // Cabezal: aquí suena la música
    c.fillStyle = col.luz;
    c.globalAlpha = 0.55;
    c.fillRect(xCabezal - 1, CABECERA, 2, H - CABECERA);
    c.globalAlpha = 1;

    // La voz: una línea de luz
    const yMin = CABECERA + 5;
    const yMax = H - PIE - 5;
    const sujetar = (y) => Math.min(yMax, Math.max(yMin, y));
    const trazar = () => {
      c.beginPath();
      let previo = null;
      for (const m of e.traza) {
        if (m.m === null) {
          previo = null;
          continue;
        }
        const x = xDe(m.p);
        if (x < CANAL - 20) {
          previo = null;
          continue;
        }
        const y = sujetar(yDe(m.m));
        if (previo && m.p - previo.p < 0.3 && Math.abs(m.m - previo.m) < 3) c.lineTo(x, y);
        else c.moveTo(x, y);
        previo = m;
      }
      c.stroke();
    };
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = propio.luz;
    c.globalAlpha = 0.35;
    c.lineWidth = 9;
    trazar();
    c.globalAlpha = 1;
    c.strokeStyle = BLANCO;
    c.lineWidth = 3;
    trazar();

    if (e.cantada !== null) {
      const yReal = yDe(e.cantada);
      const y = sujetar(yReal);
      const afinado = e.desvio !== null && Math.abs(e.desvio) <= e.tolerancia;
      if (afinado) {
        c.fillStyle = propio.luz;
        c.globalAlpha = 0.4;
        c.beginPath();
        c.arc(xCabezal, y, 19, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
      }
      c.fillStyle = BLANCO;
      c.strokeStyle = col.vano;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(xCabezal, y, 8, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      if (yReal !== y) {
        // La voz se sale de la ventana: una flecha indica hacia dónde
        this._flecha(xCabezal, y + (yReal < y ? -17 : 17), 6, yReal < y ? -1 : 1, BLANCO);
      } else if (!afinado && e.desvio !== null) {
        // Hacia dónde hay que ir para llegar a la nota
        const sentido = e.desvio < 0 ? -1 : 1;
        this._flecha(xCabezal, y + sentido * 20, 7, sentido, BLANCO);
      }
    }

    // Columna de nombres
    c.fillStyle = col.vano;
    c.fillRect(0, 0, CANAL, H);
    c.fillStyle = col.claro;
    c.fillRect(CANAL - 2, 0, 2, H);
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    const objetivoMidi = e.objetivo ? e.objetivo.midi + tr : null;
    for (let m = lo; m <= hi; m++) {
      const clase = ((m % 12) + 12) % 12;
      const esObjetivo = m === objetivoMidi;
      if (!esObjetivo) {
        if (!esNatural(m)) continue;
        if (altoFila < 17 && ![0, 4, 7].includes(clase)) continue;
        if (objetivoMidi !== null && Math.abs(m - objetivoMidi) * altoFila < 17) continue;
      }
      c.font = this._letra(esObjetivo ? 16 : 15, esObjetivo ? 700 : 600);
      c.fillStyle = esObjetivo ? propio.luz : col.luz;
      c.fillText(nombreNota(m, clase === 0 || esObjetivo), CANAL - 9, yDe(m) + 0.5);
    }
    c.fillStyle = col.luz;
    c.font = this._letra(15);
    c.textBaseline = 'alphabetic';
    c.fillText('compás', CANAL - 9, 21);
    c.textAlign = 'left';
  }

  _caja(x, y, w, h, r) {
    const c = this.c;
    const radio = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.roundRect(x, y, Math.max(1, w), h, radio);
  }

  /** Flecha de trazo: sentido -1 apunta arriba, 1 abajo. */
  _flecha(x, y, t, sentido, color) {
    const c = this.c;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = 2.5;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x - t, y - (sentido * t) / 2 + sentido * t * 0.5);
    c.lineTo(x, y + sentido * t * 0.5 + (sentido * t) / 2);
    c.lineTo(x + t, y - (sentido * t) / 2 + sentido * t * 0.5);
    c.moveTo(x, y + sentido * t);
    c.lineTo(x, y - sentido * t);
    c.stroke();
    c.restore();
  }
}
