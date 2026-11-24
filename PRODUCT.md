# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Node.js y JavaScript sin frameworks (pedido por el usuario). Servidor `node:http` sin dependencias que sirve HTML/CSS/JS estático y una API de partituras en JSON. Audio y micrófono con Web Audio API. Sin paso de compilación.

## Users

Cantores aficionados de coro, muchos de ellos mayores, que ensayan su cuerda por su cuenta o en clase. También quien da la clase, que la proyecta para enseñar qué puede hacer la IA. No son técnicos: leen solfeo a medias o cantan de oído.

## Product Purpose

Que cada cantor sepa si llega a las notas de su cuerda y ensaye afinando sobre las otras voces. Éxito: en menos de un minuto sabe qué cuerda le encaja, y al cantar ve al instante si está en la nota, alto o bajo.

## Positioning

Escucha la voz por el micrófono y la dibuja en tiempo real sobre la partitura de la propia cuerda, mientras suenan las otras voces de una obra de dominio público.

## Operating Context

Ordenador (portátil, sobremesa o proyector en clase) y móvil o tablet por igual. Micrófono del equipo; mejor con auriculares para que el acompañamiento no entre por el micro. Primera obra: Ave verum corpus de Mozart, K. 618, a cuatro voces (soprano, contralto, tenor, bajo).

## Capabilities and Constraints

- Prueba de voz: mide la nota más grave y la más aguda y las compara con cada cuerda.
- Ensayo: acompañamiento sintetizado con volumen por voz, tempo ajustable, repetición por frases, transporte por semitonos.
- Afinación en tiempo real y resumen al terminar.
- El micrófono solo funciona en `localhost` o con https.
- Las partituras son archivos JSON en `partituras/`; solo música de dominio público.
- Interfaz en español, nombres de nota en solfeo (Do, Re, Mi).

## Evidence on Hand

- Notas de las cuatro voces cotejadas entre cinco transcripciones libres; letra latina y ligaduras de la edición de Robert Garrigós (CC BY 4.0).
- Cuerdas de introducción, interludio y final transcritas de las partes de violín, viola y violonchelo.
- No hay grabaciones reales: todo el sonido es sintetizado.

## Product Principles

1. Una cosa por pantalla, dicha con palabras llanas.
2. El estado nunca depende solo del color: siempre hay una palabra o una flecha.
3. Lo que se canta manda: la voz del cantor es lo más visible de la pantalla.
4. Nada que configurar para empezar.

## Accessibility & Inclusion

Público mayor: texto grande, contraste alto, botones amplios, sin gestos finos ni atajos ocultos. Respeta `prefers-reduced-motion`.
