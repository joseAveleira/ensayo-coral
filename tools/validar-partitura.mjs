// Comprueba las partituras de la carpeta partituras/ y el detector de tono.
//   npm run validar
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DetectorTono, frecuenciaAMidi } from '../public/js/tono.js';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOMBRES = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'Si♭', 'Si'];
const nombre = (m) => NOMBRES[m % 12] + (Math.floor(m / 12) - 1);
let fallos = 0;
const falla = (texto) => {
  fallos++;
  console.log(`  ✗ ${texto}`);
};

for (const archivo of readdirSync(path.join(RAIZ, 'partituras')).filter((f) => f.endsWith('.json'))) {
  const p = JSON.parse(readFileSync(path.join(RAIZ, 'partituras', archivo), 'utf8'));
  const total = p.compases * p.compas[0];
  const silabasTexto = p.frases.reduce((s, f) => s + f.silabas, 0);
  console.log(`\n${p.titulo} — ${p.compositor} (${archivo})`);
  console.log(`  ${p.compases} compases de ${p.compas[0]}/${p.compas[1]}, ${p.frases.length} frases, ${silabasTexto} sílabas`);

  for (const voz of [...p.voces, ...(p.acompanamiento ?? [])]) {
    const esVoz = p.voces.includes(voz);
    let fin = 0;
    let silabas = 0;
    let suena = 0;
    voz.notas.forEach(([ini, dur, midi, silaba], i) => {
      if (!(dur > 0)) falla(`${voz.nombre}: la nota ${i} no dura nada`);
      if (esVoz && ini < fin - 1e-9) falla(`${voz.nombre}: la nota ${i} pisa a la anterior (pulso ${ini})`);
      if (ini + dur > total + 1e-9) falla(`${voz.nombre}: la nota ${i} se sale de la obra`);
      if (!Number.isInteger(midi) || midi < 24 || midi > 96) falla(`${voz.nombre}: altura rara en la nota ${i}`);
      if (silaba) silabas++;
      fin = Math.max(fin, ini + dur);
      suena += dur;
    });
    const midis = voz.notas.map((n) => n[2]);
    const tramo = `${nombre(Math.min(...midis))}–${nombre(Math.max(...midis))}`;
    if (esVoz) {
      if (silabas !== silabasTexto) falla(`${voz.nombre}: ${silabas} sílabas y el texto tiene ${silabasTexto}`);
      console.log(`  ${voz.nombre.padEnd(10)} ${String(voz.notas.length).padStart(3)} notas  ${tramo.padEnd(12)} canta ${suena} de ${total} pulsos`);
    } else {
      console.log(`  ${voz.nombre.padEnd(10)} ${String(voz.notas.length).padStart(3)} notas  ${tramo}`);
    }
  }
}

// Detector de tono: una voz sintética en cada nota de Mi2 a Do6, a dos frecuencias de muestreo.
console.log('\nDetector de tono');
for (const fs of [44100, 48000]) {
  const tam = 2048;
  const detector = new DetectorTono(fs, tam);
  let peor = 0;
  let errores = 0;
  for (let midi = 40; midi <= 84; midi++) {
    for (const desafino of [-0.3, 0, 0.3]) {
      const f = 440 * 2 ** ((midi + desafino - 69) / 12);
      const x = new Float32Array(tam);
      for (let i = 0; i < tam; i++) {
        const t = i / fs;
        // fundamental floja y armónicos fuertes, como una voz real
        x[i] = 0.12 * Math.sin(2 * Math.PI * f * t) + 0.2 * Math.sin(2 * Math.PI * 2 * f * t + 1) + 0.1 * Math.sin(2 * Math.PI * 3 * f * t + 2) + 0.01 * (Math.random() - 0.5);
      }
      const r = detector.detectar(x);
      const cents = r.f ? Math.abs(frecuenciaAMidi(r.f) - (midi + desafino)) * 100 : Infinity;
      if (cents > 15) {
        errores++;
        if (errores <= 5) console.log(`    ${nombre(midi)} (${f.toFixed(1)} Hz): leyó ${r.f.toFixed(1)} Hz, claridad ${r.claridad.toFixed(2)}`);
      } else peor = Math.max(peor, cents);
    }
  }
  if (errores) falla(`a ${fs} Hz: ${errores} lecturas con más de 15 cents de error`);
  else console.log(`  ✓ a ${fs} Hz: 135 notas leídas, error máximo ${peor.toFixed(1)} cents`);
}

console.log(fallos ? `\n${fallos} problema(s).` : '\nTodo correcto.');
process.exit(fallos ? 1 : 0);
