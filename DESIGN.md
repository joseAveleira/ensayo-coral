---
name: Ensayo coral
description: Vidriera para ensayar tu cuerda; tu voz es la luz que enciende los cristales.
colors:
  rubi: "oklch(0.7 0.19 22)"
  rubi-apagado: "oklch(0.4 0.11 20)"
  ambar: "oklch(0.84 0.155 85)"
  ambar-apagado: "oklch(0.47 0.085 80)"
  esmeralda: "oklch(0.77 0.165 155)"
  esmeralda-apagado: "oklch(0.42 0.085 158)"
  cobalto: "oklch(0.72 0.14 250)"
  cobalto-apagado: "oklch(0.41 0.1 258)"
  plomo: "oklch(0.225 0.032 268)"
  plomo-medio: "oklch(0.33 0.035 268)"
  plomo-suave: "oklch(0.44 0.03 265)"
  piedra: "oklch(0.953 0.007 255)"
  cal: "oklch(0.992 0.003 255)"
  piedra-honda: "oklch(0.895 0.011 255)"
  vano: "oklch(0.175 0.03 268)"
  vano-fila: "oklch(0.21 0.031 268)"
  vano-claro: "oklch(0.27 0.035 268)"
  luz: "oklch(0.975 0.03 95)"
typography:
  display:
    fontFamily: "Grenze, 'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', system-ui, 'Segoe UI', sans-serif"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Grenze, 'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', system-ui, 'Segoe UI', sans-serif"
    fontSize: "1.8rem"
    fontWeight: 600
    lineHeight: 1.1
  title:
    fontFamily: "Grenze, 'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', system-ui, 'Segoe UI', sans-serif"
    fontSize: "1.9rem"
    fontWeight: 500
    lineHeight: 1.15
  body:
    fontFamily: "'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  lead:
    fontFamily: "'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.15
  label:
    fontFamily: "'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    lineHeight: 1.5
  dato:
    fontFamily: "'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "2.3rem"
    fontWeight: 700
    lineHeight: 1.05
    fontFeature: "'tnum'"
rounded:
  cristal: "2px"
  etiqueta: "3px"
  control: "4px"
  vano: "6px"
spacing:
  margen-pagina: "clamp(1rem, 4vw, 2.5rem)"
  junta: "0.75rem"
  bloque: "1rem"
  seccion: "2rem"
components:
  boton-principal:
    backgroundColor: "{colors.plomo}"
    textColor: "{colors.cal}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 1.25rem"
    height: "52px"
  boton-principal-hover:
    backgroundColor: "{colors.plomo-medio}"
    textColor: "{colors.cal}"
  boton-secundario:
    backgroundColor: "{colors.cal}"
    textColor: "{colors.plomo}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 1.25rem"
    height: "52px"
  boton-secundario-hover:
    backgroundColor: "{colors.piedra-honda}"
    textColor: "{colors.plomo}"
  boton-texto:
    textColor: "{colors.plomo}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 0.5rem"
    height: "48px"
  boton-texto-hover:
    backgroundColor: "{colors.piedra-honda}"
    textColor: "{colors.plomo}"
  boton-deshabilitado:
    backgroundColor: "{colors.piedra-honda}"
    textColor: "{colors.plomo-suave}"
  boton-grande:
    padding: "0 1.6rem"
    height: "60px"
  boton-chico:
    padding: "0 0.85rem"
    height: "44px"
  pestana:
    textColor: "{colors.plomo}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 1.1rem"
    height: "48px"
  pestana-actual:
    backgroundColor: "{colors.plomo}"
    textColor: "{colors.cal}"
  cuerda:
    backgroundColor: "{colors.cal}"
    textColor: "{colors.plomo}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 1.1rem 0 0.85rem"
    height: "52px"
  cuerda-hover:
    backgroundColor: "{colors.piedra-honda}"
    textColor: "{colors.plomo}"
  segmento:
    backgroundColor: "{colors.cal}"
    textColor: "{colors.plomo}"
    typography: "{typography.control}"
    padding: "0 1rem"
    height: "48px"
  segmento-marcado:
    backgroundColor: "{colors.plomo}"
    textColor: "{colors.cal}"
  selector:
    backgroundColor: "{colors.cal}"
    textColor: "{colors.plomo}"
    rounded: "{rounded.control}"
    padding: "0 2.2rem 0 0.85rem"
    height: "48px"
  aviso:
    backgroundColor: "{colors.cal}"
    textColor: "{colors.plomo}"
    rounded: "{rounded.control}"
    padding: "0.85rem 1rem"
  ventana-oscura:
    backgroundColor: "{colors.vano}"
    textColor: "{colors.luz}"
    rounded: "{rounded.vano}"
  entrada:
    backgroundColor: "{colors.luz}"
    textColor: "{colors.plomo}"
    rounded: "{rounded.control}"
    padding: "0.3rem 0.85rem"
  veredicto:
    textColor: "{colors.plomo}"
    rounded: "{rounded.control}"
    padding: "0 1.1rem"
    height: "3rem"
---

# Design System: Ensayo coral

## Overview

**Creative North Star: "La Vidriera"**

La página es un muro de piedra clara y fría en el que se abren ventanas oscuras. Dentro de esas ventanas hay cristales de cuatro vidrios, uno por cuerda del coro, y lo único que los enciende es la voz de quien canta. Todo lo demás (texto, botones, filetes) es plomo: un azul negro que dibuja, separa y manda, pero no brilla. La pantalla no juzga con rojo y verde; enseña qué cristales están apagados y cuáles has encendido tú.

Es una herramienta de trabajo para cantores aficionados, muchos de ellos mayores, así que la densidad es baja y el tamaño alto: la raíz tipográfica está subida al 112,5 %, los mandos miden entre 44 y 60 px de alto y cada estado se dice con una palabra o una flecha además del color. Hay una sola familia de interfaz y un único tipo de titular. El sistema rechaza de forma expresa dos aspectos: el afinador oscuro con neón y el papel crema con serifa "de música clásica".

La vidriera no es decoración: es la codificación. El vidrio saturado significa "nota de una cuerda"; el vidrio apagado, "nota que la cuerda pide"; el vidrio encendido, "nota a la que llegas o que has afinado". Fuera de ese significado, el color de cuerda no se usa.

**Key Characteristics:**
- Piedra clara y fría como fondo; superficies de mando un punto más blancas (cal).
- Plomo azul negro para todo el texto y para filetes de 2 px (mandos, divisiones internas) y 3 px (ventanas y cortes de página).
- Cuatro vidrios, uno por cuerda: rubí soprano, ámbar contralto, esmeralda tenor, cobalto bajo; cada uno con su par apagado.
- Ventanas oscuras abiertas en la página: solo dentro de ellas hay luz.
- Estado en dos valores, apagado o encendido, siempre acompañado de palabra, flecha o marca.
- Texto grande, mandos amplios, sin sombras y con movimiento mínimo.

## Colors

Un muro casi neutro de tinte azulado, un solo oscuro que hace de tinta y de plomo, y cuatro vidrios saturados que solo aparecen cuando hablan de una cuerda.

### Primary
- **Plomo** (`plomo`): la tinta del sistema. Todo el texto principal, todos los filetes, el fondo del botón principal, de la pestaña actual y del segmento marcado, el anillo de foco y los rellenos de medidores sobre claro.
- **Plomo medio** (`plomo-medio`): únicamente el botón principal al pasar el puntero.
- **Plomo suave** (`plomo-suave`): texto secundario: rótulos de campo, rangos, letra chica, sílabas ya cantadas, pie.

### Secondary
Los vidrios. Cada superficie que pertenece a una cuerda recibe una clase de tinte que fija el vidrio vigente y su par apagado; los componentes nunca nombran un vidrio concreto, piden "el de la cuerda".
- **Rubí** (`rubi` / `rubi-apagado`): soprano.
- **Ámbar** (`ambar` / `ambar-apagado`): contralto. Es también el tinte por defecto cuando aún no hay cuerda elegida y el que usa la leyenda.
- **Esmeralda** (`esmeralda` / `esmeralda-apagado`): tenor.
- **Cobalto** (`cobalto` / `cobalto-apagado`): bajo.

El vidrio encendido aparece en: cristales alcanzados, nota afinada, óculo y banderola de la cuerda que mejor encaja, chip de cuerda elegida, fondo del veredicto "Afinado", zona central del afinador y el subrayado de vidrio. El vidrio apagado aparece en: cristales que la cuerda pide y aún no alcanzas, notas por cantar y notas que no salieron.

### Neutral
- **Piedra** (`piedra`): fondo de página.
- **Cal** (`cal`): superficies de mando: cabecera, barra de mandos fija, botones secundarios, selectores, avisos, carriles de medidor.
- **Piedra honda** (`piedra-honda`): estado al pasar el puntero sobre superficies claras, filetes de división suaves, fondo de mando deshabilitado, guías del ventanal.
- **Vano** (`vano`): el fondo de las ventanas oscuras (lectura de la prueba, lancetas, partitura en movimiento, tira del resumen).
- **Vano fila** (`vano-fila`): dentro de la partitura, las filas de notas naturales, un punto más claras.
- **Vano claro** (`vano-claro`): cristal vacío (nota que nadie pide), líneas de compás, carril de nivel dentro de una ventana.
- **Luz** (`luz`): texto y marcas dentro de las ventanas oscuras, rayo de la nota cantada, cabezal, etiqueta de "qué hacer ahora" sobre la partitura.

### Named Rules
**Regla del Cristal.** El color de cuerda significa cuerda y nada más. No hay vidrio en botones genéricos, enlaces, titulares ni adornos; si una superficie no pertenece a una cuerda, es plomo sobre piedra.

**Regla de Apagado y Encendido.** El estado tiene dos valores: cristal apagado o cristal encendido, dentro del mismo vidrio. Nunca rojo para el fallo ni verde para el acierto; rubí y esmeralda son cuerdas, no veredictos.

**Regla de Nunca Solo el Color.** Todo estado lleva además una palabra, una flecha o una marca: "Afinado" con su marca, "Sube" y "Baja" con su flecha, la marca de verificación en el chip elegido, la flecha en la nota que no salió.

**Regla de la Luz Dentro.** El texto en luz (`luz`) solo existe dentro de una ventana oscura. Sobre piedra, cal o vidrio encendido el texto es siempre plomo. Fuera de una ventana, la luz y el vidrio apagado solo asoman como muestra con filete de plomo: la leyenda y la etiqueta del rayo.

## Typography

**Display Font:** Grenze (con Atkinson Hyperlegible Next y sans del sistema como reserva)
**Body Font:** Atkinson Hyperlegible Next (con Atkinson Hyperlegible, system-ui, Segoe UI, Roboto)

**Character:** Una sans de legibilidad máxima hace todo el trabajo; Grenze, con su corte de letra gótica suavizada, aparece solo en los titulares y da el acento de piedra tallada sin caer en la serifa de programa de concierto.

La raíz está al 112,5 % (1rem equivale a 18 px con el ajuste habitual del navegador); todos los tamaños de abajo se multiplican por eso. Las fuentes se cargan hoy desde Google Fonts (Atkinson Hyperlegible Next 400/600/700, Grenze 500/600) con reserva de sistema. Alojarlas en el propio servidor es una decisión abierta, pendiente del usuario.

### Hierarchy
- **Display** (Grenze 600, `display`): el titular de cada vista, uno por pantalla. Baja a 2.3rem por debajo de 960 px y a 2rem por debajo de 720 px.
- **Headline** (Grenze 600, `headline`): titular de paso o de sección (el paso de la prueba, el resumen). 1.55rem por debajo de 720 px.
- **Title** (Grenze 500, `title`): la frase de resultado ("Tu voz va de … a …"); las notas van en 600 con subrayado de vidrio. El título de la obra en la cabecera usa el mismo tipo a 1.45rem/600.
- **Lead** (Atkinson 400, `lead`): la entradilla y los consejos, con medida de 34 a 46ch.
- **Body** (Atkinson 400, `body`): texto corrido; medida máxima observada 60 a 62ch.
- **Control** (Atkinson 700, `control`): botones, pestañas, chips, segmentos. Los botones grandes suben a 1.15rem.
- **Label** (Atkinson 600, `label`, en plomo suave): rótulos de campo y de dato. Sin mayúsculas forzadas ni espaciado añadido.
- **Dato** (Atkinson 700, `dato`, cifras tabulares): la nota pedida y la nota cantada. La lectura de la prueba usa el mismo estilo a 3.1rem; el veredicto, a 1.7rem; la letra que se canta, 600 a `clamp(1.45rem, 3.4vw, 2.1rem)`, centrada.

### Named Rules
**Regla del Titular Único.** Grenze solo en titulares (vista, paso, resultado, nombre de la obra, inicial del óculo). Rótulos, mandos, datos y cifras son siempre Atkinson.

**Regla del Suelo de Lectura.** El texto más pequeño es 0.85rem (unos 15 px) y en la partitura en movimiento 14 a 15 px reales. Nada informativo por debajo de eso.

**Regla de la Instrucción.** La corrección se escribe como lo que hay que hacer ("Sube", "Sube un poco", "Baja", "Baja un poco", "Escucha"), nunca como el error cometido. El acierto se nombra: "Afinado".

## Layout

Una columna de página centrada con ancho máximo de 78rem y margen lateral fluido (`margen-pagina`). La cabecera y el pie ocupan todo el ancho; la cabecera se cierra con un filete de plomo de 3 px.

La vista "Mi voz" es una rejilla de dos columnas 5fr/6fr con separación `clamp(2rem, 5vw, 4.5rem)`: a la izquierda, pregunta y acción (pegadas arriba al desplazar); a la derecha, los cuatro ventanales. La vista "Ensayo" es una pila vertical: barra con titular y selector de cuerda, ventana de la partitura, letra, marcador de tres columnas (nota pedida, veredicto con afinador, tu voz) y una barra de mandos pegada al pie de la pantalla, sangrada hasta los márgenes y cerrada arriba con filete de 3 px.

Ritmo: no hay escala de espaciado con nombre; los valores que se repiten son 0.75rem entre mandos de una fila (`junta`), 1rem entre bloques de una misma tarea (`bloque`) y 2rem para abrir una sección nueva (`seccion`). Las listas de filas (resumen, fichas en estrecho) se separan con filete de 2 px en piedra honda, no con tarjetas.

Cambios por anchura:
- **Hasta 960 px:** "Mi voz" pasa a una columna. Mientras se mide la voz, los ventanales ocupan la pantalla y la lectura queda fija al pie sobre cal.
- **Hasta 720 px:** se compactan cabecera, titulares y veredicto; el marcador pasa a dos columnas con el veredicto arriba a todo el ancho; los botones de la barra de mandos se reparten el ancho.
- **Contenedor del ventanal hasta 520 px:** las fichas de cuerda pasan de cuatro columnas alineadas bajo cada lanceta a una lista de filas con su botón a la derecha.

Los ventanales y la partitura se dibujan a tamaño real (una unidad por píxel) y se reconstruyen al cambiar el ancho, de modo que sus rótulos no encogen en el móvil. Ambos reservan a la izquierda un canal de 70 px (60 px en estrecho) para los nombres de nota.

## Elevation & Depth

Sistema plano. No hay ninguna sombra de caja. La profundidad se dice al revés que en una interfaz de tarjetas: en vez de levantar superficies, se abren huecos. Una ventana oscura con marco de plomo de 3 px es "más adentro" que la piedra, y lo que hay dentro puede emitir luz. La separación entre zonas claras se hace con filete, nunca con sombra ni con tarjeta elevada.

### Shadow Vocabulary
- **Resplandor de nota afinada** (lienzo: desenfoque de 14 px en el vidrio de la cuerda): solo alrededor de una nota ya cantada y afinada dentro de la partitura.
- **Halo de la voz** (trazo de 9 px del vidrio al 35 % bajo la línea blanca de 3 px; disco de 19 px al 40 % tras el punto cuando se está afinado): la voz del cantor es lo más luminoso de la pantalla.

### Named Rules
**Regla del Hueco.** La profundidad es un vano abierto en el muro, no una tarjeta levantada. Cero sombras de caja en todo el sistema.

**Regla del Resplandor Ganado.** El resplandor solo existe dentro de una ventana oscura y solo lo produce la voz: una nota afinada o el punto donde se canta. Nada brilla en reposo, y nada brilla sobre piedra.

## Shapes

Geometría de taller de vidrio: rectángulos casi rectos sujetos por plomo. Los radios son mínimos y crecen con el tamaño de la pieza: cristales y agujas (2px), medidores y etiquetas (3px), mandos (4px), ventanas oscuras (6px). No hay píldoras ni círculos salvo el óculo.

La única curva con carácter es el arco apuntado: cada lanceta se cierra con dos arcos de radio igual a su ancho (ojiva equilátera, altura 0.866 del ancho), y lleva un óculo redondo con la inicial de la cuerda. El mismo arco reaparece en pequeño en el sello de la cabecera (una lanceta partida en los cuatro vidrios), en el favicon y en la muestra de vidrio de los chips de cuerda.

El filete tiene dos pesos y significado fijo: 2 px para mandos, etiquetas y divisiones dentro de una tarea; 3 px para el marco de una ventana oscura y para los cortes de página (bajo la cabecera, sobre la barra de mandos, sobre el resumen). La lanceta de la cuerda que mejor encaja engorda su marco a 7 px.

Los iconos son de trazo: 2 px, remates y uniones redondos, sin relleno salvo los triángulos de reproducir; heredan el color del texto y miden 1.35em.

## Components

Piezas sobrias y grandes: plomo sobre cal, un filete de 2 px y una palabra clara. Ningún mando compite con la ventana.

### Buttons
- **Shape:** rectángulo de esquinas apenas rotas (4px), filete de plomo de 2 px, 52 px de alto, texto en negrita con icono de trazo opcional a la izquierda.
- **Primary:** fondo plomo, texto cal. Uno por paso; es la acción que hace avanzar ("Probar mi voz", "Empezar", "Ensayar").
- **Secondary:** fondo cal, texto plomo, mismo filete.
- **Text:** sin filete ni fondo, subrayado con separación de 0.2em, 48 px de alto; para salir o cancelar.
- **Sizes:** grande (60 px, 1.15rem) para la acción de la pantalla; chico (44 px, 0.95rem) dentro de fichas y datos; cuadrado (52 por 52 px) para los pasos de más y menos, siempre con etiqueta accesible.
- **Hover / Focus / Active:** al pasar el puntero cambia el fondo (principal a plomo medio; secundario y texto a piedra honda) en 160 ms. Al pulsar baja 1 px. El foco es un anillo de plomo de 3 px separado 3 px, igual en todo el sistema.
- **Disabled:** fondo y filete en piedra honda, texto plomo suave.

### Chips
- **Cuerda (selector de cuerda):** cuatro opciones excluyentes. En reposo, cal con filete de plomo y una muestra del vidrio en forma de pequeña lanceta. Elegida: todo el chip se llena del vidrio encendido de su cuerda y la muestra se sustituye por una marca de verificación de trazo grueso. El texto sigue en plomo.
- **Banderola:** etiqueta pequeña con filete de 2 px y fondo del vidrio encendido que dice "Tu cuerda" sobre la lanceta que mejor encaja.

### Cards / Containers
No hay tarjetas. Los dos contenedores del sistema son:
- **Ventana oscura:** fondo vano, marco de plomo de 3 px, radio de 6px, contenido recortado. Dentro, texto y marcas en luz. Se usa para la lectura de la prueba y para la partitura en movimiento; en pequeño (filete de 2 px, radio de 3px) para la tira de notas del resumen.
- **Aviso:** fondo cal, filete de plomo de 2 px, texto en 600, medida máxima de 62ch. Es un mensaje, no un estado de error en color.

### Inputs / Fields
- **Selector desplegable:** cal, filete de plomo de 2 px, 48 px de alto, texto en 600, flecha de trazo propia a la derecha.
- **Segmentos:** opciones excluyentes pegadas, filetes solapados, radio solo en los extremos; la marcada invierte a plomo con texto cal.
- **Casilla y deslizador:** controles nativos teñidos de plomo; la casilla mide 1.4rem dentro de una fila de 48 px en la que toda la etiqueta es pulsable.
- **Rótulo de campo:** encima del control, en estilo label; el valor vivo (por ejemplo la velocidad) va en plomo y negrita dentro del mismo rótulo.

### Navigation
Dos pestañas de texto en la cabecera ("Mi voz", "Ensayo"), 48 px de alto. La actual es un bloque de plomo con texto cal; las demás muestran solo su filete al pasar el puntero. A la izquierda, el sello de la lanceta con el título de la obra en Grenze y el autor debajo en plomo suave (el autor se oculta en estrecho).

### Ventanal (signature)
Cuatro lancetas ojivales, una por cuerda, con un cristal por semitono. Cada cristal tiene tres lecturas: vacío (vano claro: nadie lo pide), apagado (vidrio apagado: la cuerda lo pide) y encendido (vidrio pleno: la cuerda lo pide y tu voz llega). Lo que tu voz alcanza fuera de lo que pide la cuerda se aclara apenas, sin tomar color. Al terminar la medición los cristales se encienden de grave a agudo, 34 ms de retraso por semitono y 520 ms de transición con la curva suave. La cuerda que mejor encaja enciende su óculo, engorda su marco y recibe la banderola. La nota que se canta en el momento es un rayo de luz que cruza las cuatro lancetas; los extremos medidos quedan como líneas de puntos de plomo con etiqueta en cal.

### Partitura en movimiento (signature)
Una ventana oscura en la que las notas pasan de derecha a izquierda. Las de tu cuerda son cristales apagados con su sílaba; la que suena lleva contorno de luz y se va llenando de vidrio encendido solo en los tramos que cantas afinado; las ya afinadas quedan encendidas con resplandor y sílaba en plomo; las que no salieron quedan apagadas con una flecha que dice hacia dónde ir. Tu voz es una línea blanca con halo del vidrio y un punto en el cabezal; si no estás en la nota, una flecha junto al punto indica el sentido. Las otras voces, si se piden, son barras finas en su propio vidrio. Fuera de la frase que se repite todo queda en penumbra.

### Marcador (signature)
El veredicto es una palabra grande con su icono. En "Afinado" recibe fondo del vidrio y filete de plomo; en "Sube" y "Baja" queda en plomo sin fondo, con flecha; en "Escucha" y sin micrófono, en plomo suave. Debajo, el afinador: un carril de cal con filete, una zona central del vidrio al 60 % y una aguja de plomo que solo se muestra cuando hay voz. Los rótulos de los extremos son palabras ("bajo", "alto").

### Subrayado de vidrio
Un trazo de rotulador del vidrio de la cuerda bajo el texto en plomo (un degradado duro que cubre aproximadamente el 40 % inferior de la línea). Marca la sílaba que se canta, las notas del resultado y el nombre de la cuerda que mejor encaja. Es la forma de señalar con color de cuerda sin teñir el texto.

## Do's and Don'ts

### Do:
- **Do** escribir todo el texto sobre piedra, cal o vidrio encendido en plomo, y todo el texto dentro de una ventana oscura en luz.
- **Do** acompañar cada estado con palabra, flecha o marca; el color solo refuerza.
- **Do** dar a cada superficie de cuerda su clase de tinte y pedir "el vidrio de la cuerda", nunca un vidrio fijo.
- **Do** formular la corrección como instrucción: "Sube", "Baja", "Escucha".
- **Do** mantener los mandos entre 44 y 60 px de alto y el texto en 0.85rem o más, con la raíz al 112,5 %.
- **Do** separar con filete de plomo: 2 px dentro de una tarea, 3 px para ventanas y cortes de página.
- **Do** usar el mismo anillo de foco en todo: plomo, 3 px, separado 3 px.
- **Do** respetar la preferencia de movimiento reducido; las transiciones son de estado (120 a 200 ms) y el único encendido largo (520 ms) es el de los cristales.

### Don't:
- **Don't** usar rojo para el fallo ni verde para el acierto: rubí y esmeralda son soprano y tenor.
- **Don't** poner vidrio de cuerda en mandos, titulares o adornos que no hablen de una cuerda.
- **Don't** convertir la página en un afinador oscuro con neón: lo oscuro es una ventana con marco, no el fondo, y el resplandor solo lo gana la voz.
- **Don't** recurrir al papel crema con serifa "de música clásica": la piedra es fría y el titular es Grenze, no una romana de libro.
- **Don't** añadir sombras de caja, tarjetas elevadas, píldoras ni radios por encima de 6px.
- **Don't** usar Grenze en rótulos, botones, datos o cifras.
- **Don't** escribir el error ("Estás bajo", "Fallaste"); se escribe lo que hay que hacer.
- **Don't** teñir el texto con el vidrio para destacarlo; para eso está el subrayado de vidrio.
