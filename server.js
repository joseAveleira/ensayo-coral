// Ensayo Coral — servidor local, sin dependencias externas.
//
//   node server.js              arranca y abre el navegador
//   node server.js --no-abrir   arranca sin abrir el navegador
//   node server.js --puerto 8080   usa otro puerto (por defecto, 3000)
//
// Sirve la aplicación (carpeta public/) y las partituras que haya en la carpeta
// partituras/, con las mismas direcciones que la versión web estática
// (tools/construir-web.mjs): partituras/indice.json y partituras/<obra>.json.
// Añadir una obra nueva es dejar ahí otro archivo .json con el mismo formato.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { listarPartituras } from './tools/indice-partituras.mjs';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const PUBLICO = path.join(RAIZ, 'public');
const PARTITURAS = path.join(RAIZ, 'partituras');

const argPuerto = process.argv.indexOf('--puerto');
const PUERTO_INICIAL = Number(argPuerto > 0 ? process.argv[argPuerto + 1] : process.env.PORT) || 3000;
const ANFITRION = process.env.HOST || '127.0.0.1';
const ABRIR_NAVEGADOR = !process.argv.includes('--no-abrir');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function enviarJson(res, estado, datos) {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(estado, {
    'Content-Type': TIPOS['.json'],
    'Content-Length': Buffer.byteLength(cuerpo),
    'Cache-Control': 'no-cache',
  });
  res.end(cuerpo);
}

async function atenderPartituras(ruta, res) {
  if (ruta === '/partituras/indice.json') {
    return enviarJson(res, 200, await listarPartituras(PARTITURAS));
  }
  const m = ruta.match(/^\/partituras\/([a-z0-9-]+)\.json$/);
  if (m) {
    try {
      const texto = await readFile(path.join(PARTITURAS, `${m[1]}.json`), 'utf8');
      return enviarJson(res, 200, JSON.parse(texto));
    } catch {
      return enviarJson(res, 404, { error: 'No existe esa partitura' });
    }
  }
  return enviarJson(res, 404, { error: 'Ruta desconocida' });
}

async function atenderArchivo(ruta, res) {
  let relativa;
  try {
    relativa = decodeURIComponent(ruta);
  } catch {
    res.writeHead(400).end('Petición incorrecta');
    return;
  }
  if (relativa.endsWith('/')) relativa += 'index.html';

  const destino = path.normalize(path.join(PUBLICO, relativa));
  // Nada fuera de public/, por mucho ".." que traiga la dirección.
  if (destino !== PUBLICO && !destino.startsWith(PUBLICO + path.sep)) {
    res.writeHead(403).end('Prohibido');
    return;
  }

  try {
    const info = await stat(destino);
    if (!info.isFile()) throw new Error('no es un archivo');
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(destino).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-cache',
    });
    createReadStream(destino).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': TIPOS['.txt'] }).end('No encontrado');
  }
}

const servidor = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405).end('Método no permitido');
      return;
    }
    if (pathname.startsWith('/partituras/')) await atenderPartituras(pathname, res);
    else await atenderArchivo(pathname, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500);
    res.end('Error interno');
  }
});

function abrirNavegador(url) {
  const orden =
    process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(orden, () => {});
}

function escuchar(puerto, intentos = 20) {
  servidor.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && intentos > 0) {
      escuchar(puerto + 1, intentos - 1);
    } else {
      console.error(`No se pudo arrancar el servidor: ${error.message}`);
      process.exit(1);
    }
  });
  servidor.listen(puerto, ANFITRION, () => {
    const url = `http://localhost:${puerto}`;
    console.log('');
    console.log('  Ensayo Coral está en marcha');
    console.log(`  Ábrelo en el navegador:  ${url}`);
    console.log('  (Para pararlo, pulsa Ctrl + C en esta ventana)');
    console.log('');
    if (ABRIR_NAVEGADOR) abrirNavegador(url);
  });
}

escuchar(PUERTO_INICIAL);
