// La lista de obras que hay en partituras/. La usan el servidor local y el
// script que prepara la versión web estática.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export async function listarPartituras(carpeta) {
  const archivos = (await readdir(carpeta)).filter((f) => f.endsWith('.json') && f !== 'indice.json').sort();
  const lista = [];
  for (const archivo of archivos) {
    try {
      const p = JSON.parse(await readFile(path.join(carpeta, archivo), 'utf8'));
      lista.push({
        id: archivo.replace(/\.json$/, ''),
        titulo: p.titulo,
        compositor: p.compositor,
        catalogo: p.catalogo ?? '',
        anio: p.anio ?? null,
        voces: (p.voces ?? []).map((v) => v.nombre),
      });
    } catch (error) {
      console.warn(`  (se ignora ${archivo}: ${error.message})`);
    }
  }
  return lista;
}
