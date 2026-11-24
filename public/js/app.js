// Arranque: carga la partitura, recupera lo guardado y reparte entre las dos vistas.

import { cargarPartitura } from './partitura.js';
import { iniciarVoz } from './voz.js';
import { iniciarEnsayo } from './ensayo.js';

const CLAVE = 'ensayo-coral:v1';

const DE_FABRICA = {
  cuerda: null,
  voz: null, // { grave, aguda } en MIDI
  tempo: null,
  miVoz: 'fuerte',
  bucle: false,
  verTodas: false,
  claqueta: false,
  transporte: 0,
  auriculares: false,
  octavas: false,
  exigente: false,
  silenciadas: [],
  micro: '',
};

function leerEstado() {
  try {
    return { ...DE_FABRICA, ...JSON.parse(localStorage.getItem(CLAVE) ?? '{}') };
  } catch {
    return { ...DE_FABRICA };
  }
}

async function arrancar() {
  let partitura;
  try {
    const lista = await (await fetch('partituras/indice.json')).json();
    partitura = await cargarPartitura(lista[0].id);
  } catch (error) {
    console.error(error);
    const aviso = document.createElement('p');
    aviso.className = 'aviso';
    aviso.textContent = 'No he podido cargar la partitura. Comprueba la conexión (o que el programa sigue en marcha) y recarga la página.';
    document.querySelector('main').replaceChildren(aviso);
    aviso.style.margin = '2rem auto';
    return;
  }

  const estado = leerEstado();
  if (!partitura.voces.some((v) => v.id === estado.cuerda)) estado.cuerda = null;
  if (!Array.isArray(estado.silenciadas)) estado.silenciadas = [];
  estado.tempo ??= partitura.tempo;
  const guardar = () => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch {
      /* sin almacenamiento: se pierde al cerrar, nada más */
    }
  };

  document.title = `Ensayo coral · ${partitura.titulo}`;
  document.getElementById('obra-titulo').textContent = partitura.titulo;
  document.getElementById('obra-autor').textContent = [partitura.compositor, partitura.catalogo].filter(Boolean).join(' · ');
  document.getElementById('creditos').textContent = partitura.creditos ?? '';

  const ensayo = iniciarEnsayo({ partitura, estado, guardar });
  const voz = iniciarVoz({ partitura, estado, guardar, elegirCuerda: (id) => ensayo.elegirCuerda(id) });
  const vistas = { voz, ensayo };

  let actual = null;
  function mostrar() {
    const nombre = location.hash === '#ensayo' ? 'ensayo' : 'voz';
    if (nombre === actual) return;
    if (actual) vistas[actual].salir();
    actual = nombre;
    for (const seccion of document.querySelectorAll('.vista')) seccion.hidden = seccion.dataset.vista !== nombre;
    for (const pestana of document.querySelectorAll('.pestana')) {
      if (pestana.dataset.vista === nombre) pestana.setAttribute('aria-current', 'page');
      else pestana.removeAttribute('aria-current');
    }
    vistas[nombre].entrar();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', mostrar);
  mostrar();
}

arrancar();
