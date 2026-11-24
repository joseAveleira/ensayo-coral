// Prepara la versión web estática: la aplicación no necesita servidor propio,
// así que basta con copiar public/ y las partituras a una carpeta y servirla
// desde cualquier alojamiento de archivos (GitHub Pages, por ejemplo).
//
//   node tools/construir-web.mjs            deja el resultado en _site/
//   node tools/construir-web.mjs carpeta    o en la carpeta que se diga

import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listarPartituras } from './indice-partituras.mjs';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLICO = path.join(RAIZ, 'public');
const PARTITURAS = path.join(RAIZ, 'partituras');
const destino = path.resolve(process.argv[2] ?? path.join(RAIZ, '_site'));

await rm(destino, { recursive: true, force: true });
await cp(PUBLICO, destino, { recursive: true });
await mkdir(path.join(destino, 'partituras'), { recursive: true });

const lista = await listarPartituras(PARTITURAS);
for (const { id } of lista) {
  await cp(path.join(PARTITURAS, `${id}.json`), path.join(destino, 'partituras', `${id}.json`));
}
await writeFile(path.join(destino, 'partituras', 'indice.json'), JSON.stringify(lista));
// Sin esto GitHub Pages pasa los archivos por Jekyll, que aquí no hace falta.
await writeFile(path.join(destino, '.nojekyll'), '');

console.log(`Web lista en ${destino}: ${lista.length} ${lista.length === 1 ? 'obra' : 'obras'}.`);
