// Los cuatro ventanales de la portada: una lanceta por cuerda y un cristal por
// semitono. Se dibuja en SVG a tamaño real (1 unidad = 1 píxel) para que los
// rótulos no encojan en el móvil.

import { nombreNota } from './partitura.js';

const SVG = 'http://www.w3.org/2000/svg';

function crear(nombre, atributos = {}, padre = null) {
  const el = document.createElementNS(SVG, nombre);
  for (const [clave, valor] of Object.entries(atributos)) el.setAttribute(clave, valor);
  padre?.append(el);
  return el;
}

export class Ventanal {
  constructor(contenedor, partitura) {
    this.contenedor = contenedor;
    this.partitura = partitura;
    this.voz = null; // { grave, aguda } medidos
    this.mejor = null; // id de la cuerda que mejor encaja
    this.provisional = { grave: null, aguda: null };
    this._ancho = 0;
    this._rayoMidi = null;
    new ResizeObserver(() => {
      const ancho = Math.round(this.contenedor.clientWidth);
      if (ancho && ancho !== this._ancho) this._construir();
    }).observe(contenedor);
    this._construir();
  }

  _construir() {
    const ancho = Math.round(this.contenedor.clientWidth);
    if (!ancho) return;
    this._ancho = ancho;
    const p = this.partitura;
    const n = p.voces.length;
    const estrecho = ancho < 480;

    const canal = estrecho ? 60 : 70;
    const margen = estrecho ? 2 : 8;
    const hueco = estrecho ? 10 : Math.min(26, ancho * 0.04);
    const anchoLanceta = (ancho - canal - margen - hueco * (n - 1)) / n;
    const fila = estrecho || window.innerHeight < 820 ? 11 : 13;
    const arco = anchoLanceta * 0.866;

    const extremos = [p.min - 3, p.max + 3];
    for (const m of [this.voz?.grave, this.voz?.aguda, this.provisional.grave, this.provisional.aguda]) {
      if (m != null) {
        extremos[0] = Math.min(extremos[0], m - 1);
        extremos[1] = Math.max(extremos[1], m + 1);
      }
    }
    const [lo, hi] = extremos;
    const filas = hi - lo + 1;
    const yTabla = 4 + arco;
    const alto = yTabla + filas * fila + 6;

    this.geo = { canal, margen, hueco, anchoLanceta, fila, lo, hi, yTabla, ancho };
    const yDe = (midi) => yTabla + (hi - midi + 0.5) * fila;
    this._yDe = yDe;

    const padre = this.contenedor.parentElement;
    padre.style.setProperty('--vt-canal', `${canal}px`);
    padre.style.setProperty('--vt-hueco', `${hueco}px`);
    padre.style.setProperty('--vt-margen', `${margen}px`);

    const svg = crear('svg', { viewBox: `0 0 ${ancho} ${alto}`, width: ancho, height: alto, 'aria-hidden': 'true' });

    // Guías y rótulos de los does
    for (let m = lo; m <= hi; m++) {
      if (((m % 12) + 12) % 12 !== 0) continue;
      const y = yDe(m);
      crear('line', { class: 'vt-guia', x1: canal - 4, x2: ancho - margen, y1: y, y2: y }, svg);
      crear('text', { class: 'vt-rotulo', x: canal - 10, y, 'data-midi': m }, svg).textContent = nombreNota(m);
    }

    this._cristales = [];
    this._lancetas = [];
    p.voces.forEach((voz, i) => {
      const x = canal + i * (anchoLanceta + hueco);
      const g = crear('g', { class: `vt-lanceta tinte-${voz.tinte}` }, svg);
      const yBase = alto - 2;
      // Arco apuntado: dos arcos de radio igual a la luz del vano.
      crear('path', {
        class: 'vt-vano',
        d: `M${x} ${yBase}V${yTabla}A${anchoLanceta} ${anchoLanceta} 0 0 1 ${x + anchoLanceta / 2} ${yTabla - arco}A${anchoLanceta} ${anchoLanceta} 0 0 1 ${x + anchoLanceta} ${yTabla}V${yBase}Z`,
      }, g);

      const pedidas = new Set(voz.alturas.map((a) => a.midi));
      const filaCristales = [];
      for (let m = lo; m <= hi; m++) {
        const rect = crear('rect', {
          class: pedidas.has(m) ? 'vt-cr pide' : 'vt-cr',
          x: x + 5,
          y: yDe(m) - fila / 2 + 1,
          width: anchoLanceta - 10,
          height: fila - 2,
          rx: 1.5,
        }, g);
        filaCristales.push({ midi: m, rect });
      }
      this._cristales.push(filaCristales);

      const r = anchoLanceta * 0.23;
      const cy = yTabla - arco * 0.36;
      crear('circle', { class: 'vt-oculo', cx: x + anchoLanceta / 2, cy, r }, g);
      const inicial = crear('text', { class: 'vt-inicial', x: x + anchoLanceta / 2, y: cy + 1, 'font-size': r * 1.25 }, g);
      inicial.textContent = voz.abrev ?? voz.nombre[0];
      this._lancetas.push({ voz, g });
    });

    // Marcas de la voz medida
    this._marcas = {};
    for (const cual of ['grave', 'aguda']) {
      const g = crear('g', { class: 'vt-marca', hidden: '' }, svg);
      crear('line', { x1: canal - 4, x2: ancho - margen, y1: 0, y2: 0 }, g);
      crear('rect', { class: 'vt-etq', x: 1, y: -13, width: canal - 8, height: 26, rx: 3 }, g);
      crear('text', { x: (canal - 6) / 2, y: 1 }, g);
      this._marcas[cual] = g;
    }

    // Rayo: la nota que se está cantando ahora mismo
    const rayo = crear('g', { class: 'vt-rayo', hidden: '' }, svg);
    p.voces.forEach((_, i) => {
      crear('rect', { x: canal + i * (anchoLanceta + hueco) + 3, y: -2.5, width: anchoLanceta - 6, height: 5, rx: 2 }, rayo);
    });
    crear('rect', { class: 'vt-etq', x: 0, y: -14, width: canal - 6, height: 28, rx: 3 }, rayo);
    crear('text', { x: (canal - 6) / 2, y: 1 }, rayo);
    this._rayo = rayo;

    this.contenedor.replaceChildren(svg);
    this._svg = svg;
    this._pintar(false);
    this.rayo(this._rayoMidi);
  }

  _pintar(animar) {
    if (!this._svg) return; // aún sin medidas: se pintará al construir
    const grave = this.voz?.grave ?? this.provisional.grave;
    const aguda = this.voz?.aguda ?? this.provisional.aguda;
    const completo = grave != null && aguda != null;

    this._cristales.forEach((fila) => {
      for (const { midi, rect } of fila) {
        const dentro = completo && midi >= grave && midi <= aguda;
        rect.style.transitionDelay = animar && completo ? `${Math.max(0, midi - grave) * 34}ms` : '0ms';
        rect.classList.toggle('alcance', dentro);
      }
    });
    this._lancetas.forEach(({ voz, g }) => g.classList.toggle('es-mejor', completo && voz.id === this.mejor));

    for (const [cual, midi] of [['grave', grave], ['aguda', aguda]]) {
      const g = this._marcas[cual];
      g.toggleAttribute('hidden', midi == null);
      if (midi != null) {
        g.setAttribute('transform', `translate(0 ${this._yDe(midi)})`);
        g.querySelector('text').textContent = nombreNota(midi);
      }
    }
    // Los rótulos fijos que chocarían con una marca se apartan.
    for (const rotulo of this._svg.querySelectorAll('.vt-rotulo')) {
      const m = Number(rotulo.dataset.midi);
      const choca = [grave, aguda].some((x) => x != null && Math.abs(x - m) <= 1);
      rotulo.toggleAttribute('hidden', choca);
    }
  }

  /** Fija la voz medida ({ grave, aguda } o null) y la cuerda que mejor encaja. */
  ponerVoz(voz, mejor = null, animar = true) {
    this.voz = voz;
    this.mejor = mejor;
    this.provisional = { grave: null, aguda: null };
    if (!this._svg) return;
    const cabe = (m) => m == null || (m - 1 >= this.geo.lo && m + 1 <= this.geo.hi);
    if (voz && !(cabe(voz.grave) && cabe(voz.aguda))) this._construir();
    else this._pintar(animar);
  }

  /** Durante la prueba: enseña el extremo que se lleva medido. */
  marcar(cual, midi) {
    this.provisional[cual] = midi;
    if (!this._svg) return;
    const { lo, hi } = this.geo;
    if (midi != null && (midi - 1 < lo || midi + 1 > hi)) this._construir();
    else this._pintar(false);
  }

  /** Mueve el rayo de luz a la nota cantada (o lo apaga con null). */
  rayo(midi) {
    this._rayoMidi = midi;
    if (!this._svg) return;
    const { lo, hi } = this.geo;
    const visible = midi != null && midi >= lo - 0.5 && midi <= hi + 0.5;
    this._rayo.toggleAttribute('hidden', !visible);
    if (!visible) return;
    this._rayo.setAttribute('transform', `translate(0 ${this._yDe(midi).toFixed(1)})`);
    const texto = this._rayo.querySelector('text');
    const nombre = nombreNota(midi);
    if (texto.textContent !== nombre) texto.textContent = nombre;
  }
}
