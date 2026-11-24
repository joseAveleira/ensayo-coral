// Modelo de la partitura: carga, nombres de nota y consultas.

const NOMBRES = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'Si♭', 'Si'];

/** Nombre en solfeo. Con octava: La4 es el la del diapasón (440 Hz) y Do4 el do central. */
export function nombreNota(midi, conOctava = true) {
  const m = Math.round(midi);
  const nombre = NOMBRES[((m % 12) + 12) % 12];
  return conOctava ? `${nombre}${Math.floor(m / 12) - 1}` : nombre;
}

export const esNatural = (midi) => ![1, 3, 6, 8, 10].includes(((Math.round(midi) % 12) + 12) % 12);

function prepararNotas(lista) {
  return lista.map(([ini, dur, midi, silaba], i) => ({
    i,
    ini,
    dur,
    fin: ini + dur,
    midi,
    silaba: silaba ?? null,
  }));
}

/** Notas distintas que pide una voz, de grave a aguda, con el tiempo total que suena cada una. */
function alturas(notas) {
  const mapa = new Map();
  for (const n of notas) mapa.set(n.midi, (mapa.get(n.midi) ?? 0) + n.dur);
  return [...mapa.entries()].sort((a, b) => a[0] - b[0]).map(([midi, tiempo]) => ({ midi, tiempo }));
}

export async function cargarPartitura(id) {
  const respuesta = await fetch(`/api/partituras/${id}`);
  if (!respuesta.ok) throw new Error('No se pudo cargar la partitura');
  const p = await respuesta.json();

  p.id = id;
  p.pulsosPorCompas = p.compas[0];
  p.total = p.compases * p.pulsosPorCompas;
  p.voces = p.voces.map((v, indice) => {
    const notas = prepararNotas(v.notas);
    const midis = notas.map((n) => n.midi);
    return {
      ...v,
      indice,
      tinte: TINTES[indice % TINTES.length],
      notas,
      frases: frasesDeVoz(notas, p.frases),
      min: Math.min(...midis),
      max: Math.max(...midis),
      alturas: alturas(notas),
    };
  });
  p.acompanamiento = (p.acompanamiento ?? []).map((a) => ({ ...a, notas: prepararNotas(a.notas) }));
  p.min = Math.min(...p.voces.map((v) => v.min));
  p.max = Math.max(...p.voces.map((v) => v.max));
  return p;
}

// Un vidrio por cuerda, en el orden de la partitura.
const TINTES = ['rubi', 'ambar', 'esmeralda', 'cobalto'];

/**
 * Las frases del texto son las mismas para todas las cuerdas, pero cada una las
 * canta en su momento (los hombres entran un compás después en «esto nobis»).
 * Se reparten por número de sílabas para saber dónde empieza y acaba cada frase
 * en cada voz.
 */
function frasesDeVoz(notas, frases) {
  const conSilaba = notas.filter((n) => n.silaba !== null);
  const lista = [];
  let k = 0;
  for (const frase of frases) {
    const primera = conSilaba[k];
    if (!primera) break;
    const siguiente = conSilaba[k + frase.silabas];
    const ultima = siguiente ? notas[siguiente.i - 1] : notas[notas.length - 1];
    lista.push({
      i: lista.length,
      texto: frase.texto,
      desde: primera.ini,
      hasta: ultima.fin,
      primera: primera.i,
      ultima: ultima.i,
    });
    k += frase.silabas;
  }
  return lista;
}

/** Nota que suena en el pulso dado (o null). Las notas vienen ordenadas y no se pisan. */
export function notaEn(notas, pulso) {
  let a = 0;
  let b = notas.length - 1;
  while (a <= b) {
    const m = (a + b) >> 1;
    const n = notas[m];
    if (pulso < n.ini) b = m - 1;
    else if (pulso >= n.fin) a = m + 1;
    else return n;
  }
  return null;
}

/** Primera nota que empieza en el pulso dado o después. */
export function siguienteNota(notas, pulso) {
  let a = 0;
  let b = notas.length;
  while (a < b) {
    const m = (a + b) >> 1;
    if (notas[m].ini < pulso) a = m + 1;
    else b = m;
  }
  return notas[a] ?? null;
}

/** La frase que se está cantando en ese pulso o, en un silencio, la que viene. */
export function fraseDe(voz, pulso) {
  return voz.frases.find((f) => pulso < f.hasta) ?? voz.frases[voz.frases.length - 1];
}

export const compasDe = (partitura, pulso) => Math.floor(pulso / partitura.pulsosPorCompas) + 1;

/**
 * Compara la voz medida (grave..aguda, en MIDI) con lo que pide una cuerda.
 * Devuelve qué notas quedan fuera y cuántos semitonos habría que mover la obra
 * para que entrara entera (0 si ya entra, null si no cabe de ninguna forma).
 */
export function encaje(voz, grave, aguda, transporte = 0) {
  const pedidas = voz.alturas.map((a) => ({ ...a, midi: a.midi + transporte }));
  const fueraGraves = pedidas.filter((a) => a.midi < grave);
  const fueraAgudas = pedidas.filter((a) => a.midi > aguda);
  const tiempoTotal = pedidas.reduce((s, a) => s + a.tiempo, 0);
  const tiempoFuera = [...fueraGraves, ...fueraAgudas].reduce((s, a) => s + a.tiempo, 0);

  const min = voz.min + transporte;
  const max = voz.max + transporte;
  let ajuste = 0;
  if (max - min > aguda - grave) ajuste = null;
  else if (min < grave) ajuste = grave - min;
  else if (max > aguda) ajuste = aguda - max;

  return {
    voz,
    total: pedidas.length,
    dentro: pedidas.length - fueraGraves.length - fueraAgudas.length,
    fueraGraves,
    fueraAgudas,
    cobertura: tiempoTotal ? 1 - tiempoFuera / tiempoTotal : 1,
    holgura: Math.min(min - grave, aguda - max),
    ajuste,
  };
}
