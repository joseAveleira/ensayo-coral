// Un solo contexto de audio, un coro y un micrófono para toda la aplicación.
// Se crean con el primer gesto del usuario: los navegadores no dejan sonar antes.

import { Coro } from './sintetizador.js';
import { Microfono } from './tono.js';

let audio = null;

export function obtenerAudio(partitura) {
  if (!audio) {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    const ctx = new Contexto({ latencyHint: 'interactive' });
    audio = { ctx, coro: new Coro(ctx, partitura), mic: new Microfono(ctx) };
  }
  audio.ctx.resume();
  return audio;
}

/** El audio ya creado, o null si todavía no ha habido ningún gesto. */
export const audioActual = () => audio;

export function explicarErrorMicro(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'No tengo permiso para usar el micrófono. Pulsa el candado que hay junto a la dirección de la página, permite el micrófono y vuelve a intentarlo.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No encuentro ningún micrófono. Conecta uno y vuelve a intentarlo.';
    case 'NotReadableError':
      return 'Otro programa está usando el micrófono. Ciérralo y vuelve a intentarlo.';
    case 'SinSoporte':
      return 'Este navegador no deja usar el micrófono aquí. Abre la aplicación en http://localhost o en una dirección https.';
    default:
      return 'No he podido encender el micrófono. Vuelve a intentarlo.';
  }
}
