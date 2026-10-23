---
name: strim
description: Streaming en vivo en español; el estado del canal se dibuja con el nodo de anillos del logo.
colors:
  noche: "#12101f"
  panel: "#1a1830"
  relieve: "#24213f"
  linea: "#312d52"
  pantalla: "#0b0a16"
  texto: "#efedf9"
  texto-suave: "#a7a4c4"
  texto-tenue: "#8e8bb2"
  senal: "#12c4e3"
  senal-fuerte: "#4fd6ee"
  al-aire: "#2410d0"
  teal: "#0098b3"
  error: "#ff7a8a"
  peligro: "#d1343b"
  blanco: "#ffffff"
  nombre-1: "#4fd6ee"
  nombre-2: "#a9a6ff"
  nombre-3: "#6fe3c1"
  nombre-4: "#ff9ec0"
  nombre-5: "#ffc46b"
  logo-cian: "#0ec2e1"
  logo-indigo: "#1900b3"
  logo-onda: "#0b45bd"
typography:
  display:
    fontFamily: "'Bricolage Grotesque Variable', 'Figtree Variable', system-ui, sans-serif"
    fontSize: "2.4375rem"
    fontWeight: 800
    lineHeight: "2.75rem"
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Bricolage Grotesque Variable', 'Figtree Variable', system-ui, sans-serif"
    fontSize: "1.9375rem"
    fontWeight: 800
    lineHeight: "2.375rem"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Bricolage Grotesque Variable', 'Figtree Variable', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: "1.75rem"
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Figtree Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  chat:
    fontFamily: "'Figtree Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.375rem"
  label:
    fontFamily: "'Figtree Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: "1.25rem"
  caption:
    fontFamily: "'Figtree Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: "1rem"
  mono:
    fontFamily: "ui-monospace, 'Cascadia Mono', 'SF Mono', Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
rounded:
  campo: "12px"
  panel: "20px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "16px"
  panel-movil: "20px"
  lg: "24px"
  xl: "32px"
  xxl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.senal}"
    textColor: "{colors.noche}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.senal-fuerte}"
  button-secondary:
    backgroundColor: "{colors.relieve}"
    textColor: "{colors.texto}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  button-ghost:
    textColor: "{colors.texto}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.relieve}"
  button-danger:
    backgroundColor: "{colors.peligro}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  button-al-aire:
    backgroundColor: "{colors.al-aire}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "36px"
  button-sm:
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "36px"
  icon-button:
    textColor: "{colors.texto-suave}"
    rounded: "{rounded.full}"
    size: "44px"
  input:
    backgroundColor: "{colors.relieve}"
    textColor: "{colors.texto}"
    typography: "{typography.body}"
    rounded: "{rounded.campo}"
    padding: "0 16px"
    height: "44px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.texto}"
    rounded: "{rounded.panel}"
    padding: "24px"
  panel-al-aire:
    backgroundColor: "{colors.al-aire}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.panel}"
    padding: "24px"
  live-badge:
    backgroundColor: "{colors.al-aire}"
    textColor: "{colors.blanco}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "0 10px 0 6px"
    height: "24px"
  chat-streamer-badge:
    backgroundColor: "{colors.al-aire}"
    textColor: "{colors.blanco}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "0 8px"
    height: "20px"
  toast:
    backgroundColor: "{colors.relieve}"
    textColor: "{colors.texto}"
    typography: "{typography.label}"
    rounded: "{rounded.campo}"
    padding: "12px 16px"
  video-frame:
    backgroundColor: "{colors.pantalla}"
    rounded: "{rounded.panel}"
---

# Design System: strim

## Overview

**Creative North Star: "El nodo en la noche"**

strim vive en una noche índigo plana: fondo `noche`, paneles un tono más claros, bordes de 1 px en `linea`. Sobre esa base hay solo dos colores con significado. El cian `senal` es la acción, el foco y los anillos; el índigo `al-aire` significa una sola cosa: "en vivo". El estado del canal no se comunica con brillos ni pulsos de neón sino con la forma del cuarto nodo del logo (anillo hueco, anillos que se cierran hacia el centro, nodo lleno con anillos) y, en el estudio, con un campo de color completo.

La densidad es la de un producto de streaming estándar: barra superior de 56 px, video 16:9 y chat lateral de 360 px, tarjetas en rejilla en el inicio. La personalidad la ponen la tipografía (Bricolage Grotesque en peso 800 con interletrado cerrado para los títulos, Figtree para todo lo demás), las formas redondas (círculos para avatares y estados, cápsulas para botones e insignias, paneles de 20 px) y el nodo de estado, que es el único movimiento en bucle de la app.

Rechazo confirmado por la dirección: el "app oscura con brillo neón y vidrio" del género. No hay vidrio, desenfoques de fondo, brillos ni degradados en la interfaz.

**Key Characteristics:**
- Solo modo oscuro (`color-scheme: dark`), profundidad por capas tonales, no por sombras.
- Dos acentos con semántica fija: `senal` actúa, `al-aire` está en vivo.
- El estado del canal siempre se dibuja con el nodo de anillos y siempre se dice también en texto.
- Títulos en Bricolage 800 a −0,02em; texto en Figtree; todo en español.
- Círculos, cápsulas y paneles de 20 px; bordes de 1 px en `linea`.

## Colors

Una noche índigo de cuatro capas con un cian de acción y un índigo reservado para "en vivo".

### Primary
- **Cian señal** (`senal`): botón primario, foco visible (contorno de 2 px), cursor de texto, anillos del nodo, anillo de avatar en vivo, borde de tarjeta en hover/foco, íconos de éxito y el botón flotante "Mensajes nuevos". Lleva texto `noche` encima, nunca blanco.
- **Cian vivo** (`senal-fuerte`): solo el hover de lo que ya es `senal`.

### Secondary
- **Índigo al aire** (`al-aire`): significa "en vivo" y nada más. Insignia "En vivo", insignia "Streamer" del chat, el botón "En vivo" de la barra (que sustituye a "Transmitir") y el panel de estado completo del estudio cuando el canal está al aire. Encima lleva `blanco`, y el nodo en `senal`.

### Tertiary
- **Teal de marca** (`teal`): solo la palabra "strim" del logo.
- **Colores del símbolo** (`logo-cian`, `logo-indigo`, `logo-onda`): exclusivos del dibujo del logo.
- **Tonos de nombre** (`nombre-1` a `nombre-5`): el color fijo de cada username, derivado del nombre. Colorea los nombres en el chat y, mezclado con `relieve` al 22 %, el fondo de las iniciales del avatar; mezclado con `panel` al 8 %, el fondo del marco de las tarjetas de canal. Todos superan 4,5:1 sobre `panel`.

### Neutral
- **Noche** (`noche`): fondo de la página y de la barra superior; pista de las pestañas de cuenta.
- **Panel** (`panel`): paneles del estudio y ajustes, chat, modal, menú de usuario.
- **Relieve** (`relieve`): campos, botón secundario, avisos, hover de botones fantasma, esqueletos de carga.
- **Línea** (`linea`): todos los bordes de 1 px y divisores; también la barra de desplazamiento.
- **Pantalla** (`pantalla`): el fondo del marco de video y de la vista previa, más oscuro que la noche.
- **Texto** (`texto`), **texto suave** (`texto-suave`), **texto tenue** (`texto-tenue`): principal; secundario (descripciones, ayudas, estadísticas); terciario (marcadores de posición, contadores, tiempo en vivo de las tarjetas).
- **Error** (`error`) y **peligro** (`peligro`): `error` para mensajes y bordes de campos inválidos (y el fondo de la alerta de formulario al 10 %); `peligro` solo como fondo del botón destructivo, con texto `blanco`.

### Named Rules
**The Una Sola Señal Rule.** `al-aire` nunca decora: si aparece, algo está en vivo. Una pantalla sin canales en vivo no tiene índigo.

**The Cian Actúa Rule.** `senal` marca lo accionable y el foco. Un elemento cian que no se puede pulsar ni enfocar solo es aceptable como anillo de estado o ícono de confirmación.

## Typography

**Display Font:** Bricolage Grotesque Variable (con Figtree y system-ui de respaldo)
**Body Font:** Figtree Variable (con system-ui, -apple-system, Segoe UI)
**Label/Mono Font:** monoespaciada del sistema (ui-monospace, Cascadia Mono, SF Mono, Consolas) solo para los datos de OBS

**Character:** Bricolage pesada y apretada da voz a los títulos y al estado; Figtree, redonda y neutra, carga el texto, el chat y los controles sin competir.

### Hierarchy
Escala 1,25 sobre 16 px. `h1`, `h2` y `h3` usan Bricolage con −0,02em y `text-wrap: balance`; los párrafos usan `text-wrap: pretty`.
- **Display** (800, 39 px / 44 px): el estado del estudio ("En vivo", "Desconectado"); en móvil baja a 31 px.
- **Headline** (800, 31 px / 38 px): el `h1` de cada página ("En vivo ahora", "Estudio") y el título de los estados vacíos.
- **Title** (700, 20 px / 28 px): títulos de panel y de modal, nombre del canal; el título del stream en el canal sube a 25 px en escritorio.
- **Body** (400, 16 px / 24 px): texto corrido, campos, descripciones; bio a 70ch como máximo, textos de estado a 44 a 52ch.
- **Chat** (400, 15 px / 22 px): mensajes; el nombre del autor en 700 en su tono.
- **Label** (600, 14 px / 20 px): etiquetas de campo, botones pequeños, avisos.
- **Caption** (700, 12 px / 16 px): insignias; en 400 para contadores y horas, siempre con cifras tabulares.

### Named Rules
**The Cifras Tabulares Rule.** Todo número que cambia (espectadores, tiempo en vivo, contadores de caracteres, horas del chat) usa `tabular-nums` para no hacer saltar el texto.

**The Sin Mayúsculas Rule.** No hay texto en mayúsculas sostenidas ni interletrado abierto; las etiquetas son oraciones en caja normal.

## Layout

- **Barra superior:** 56 px fija arriba, `noche` con borde inferior `linea`; relleno lateral 16 px (24 px desde 640 px).
- **Páginas de contenido:** contenedor centrado de 1280 px como máximo, relleno 16/24 px, vertical 32/40 px. Ajustes usa una columna de 640 px; las páginas de cuenta, una columna de 400 px con el logo de 40 px encima y sin barra.
- **Inicio:** rejilla `auto-fill` con columnas de 280 px mínimo, 24 px entre columnas y 32 px entre filas.
- **Canal:** desde 1024 px, video fluido con 24 px de margen a la izquierda y chat de 360 px a todo el alto a la derecha, separado por un borde `linea`. Debajo de 1024 px, el video va a sangre y el chat ocupa el resto del alto bajo la información del canal, que se pliega con un botón de chevron.
- **Estudio:** dos columnas 7fr / 5fr desde 1024 px (panel de estado a la izquierda; "Conectar OBS" y la guía a la derecha), una sola columna debajo.
- **Ritmo:** 24 px entre paneles, 20 px de relleno de panel en móvil y 24 px desde 640 px, 6 px entre etiqueta y control, 12 px entre controles de una fila.
- **Puntos de quiebre:** 640 px (`sm`) y 1024 px (`lg`). Probado de 360 px a escritorio.

## Elevation & Depth

Plano por capas tonales: `pantalla` < `noche` < `panel` < `relieve`, cada capa delimitada por un borde de 1 px en `linea`. Las superficies en reposo no tienen sombra. Solo los elementos que flotan sobre el contenido llevan una sombra ambiental, oscura, difusa y sin desplazamiento lateral; el modal no lleva sombra y se separa con un velo `rgb(10 9 20 / 0.72)`.

### Shadow Vocabulary
- **Aviso** (`box-shadow: 0 12px 32px -8px rgb(5 4 12 / 0.7)`): avisos (toasts).
- **Menú** (`box-shadow: 0 16px 40px -12px rgb(5 4 12 / 0.8)`): menú desplegable de usuario.
- **Flotante** (`box-shadow: 0 8px 20px -6px rgb(5 4 12 / 0.8)`): botón "Mensajes nuevos" sobre el chat.

### Named Rules
**The Sin Vidrio Rule.** Nada de `backdrop-filter`, brillos de color, sombras de neón ni degradados. La profundidad la dan el tono y el borde; la sombra solo despega lo que flota.

## Shapes

Tres radios y el círculo. Cápsula (`full`) para botones, botones de ícono, insignias, pestañas y "Mensajes nuevos". Campo (12 px) para campos, campos de copiar, avisos, alertas, esqueletos y la vista previa del estudio. Panel (20 px) para paneles, modal, menú, marco de video en escritorio y marco de tarjeta. Círculo para avatares, el nodo de estado y los números de la guía de OBS. Todos los bordes son de 1 px; el anillo de en vivo del avatar es un contorno de 2 px en `senal` separado 2 px.

El nodo de estado (SVG de 40 × 40, trazo de 1,5 px reales mínimo, tamaños 12, 24 y 72 px) es la forma propia del sistema:
- **Desconectado:** anillo hueco en `texto-suave`.
- **Esperando señal:** anillo tenue en `senal` al 35 %, punto central y tres anillos que se cierran hacia el centro en 2,4 s (en 12 px, solo anillo y punto). Con movimiento reducido, los anillos quedan quietos y concéntricos.
- **En vivo:** nodo lleno en `senal` con dos anillos (uno en 12 px).

## Components

### Buttons
Cápsulas firmes, semibold, sin sombra.
- **Shape:** cápsula (`full`); 44 px de alto con 20 px laterales, o 36 px con 16 px en tamaño pequeño; 8 px (6 px en pequeño) entre ícono y texto.
- **Primary:** `senal` con texto `noche`; hover a `senal-fuerte`.
- **Secondary:** `relieve` con borde `linea` y texto `texto`; hover lleva el borde a `texto-tenue`.
- **Ghost:** sin fondo, texto `texto`; hover con fondo `relieve`.
- **Danger:** `peligro` con texto `blanco`; hover sube el brillo al 110 %. Solo en confirmaciones destructivas.
- **Al aire:** `al-aire` con texto `blanco`; hover al 125 % de brillo. Solo el botón de la barra cuando el canal está en vivo.
- **Estados:** transición de 150 ms en fondo, borde y filtro. Deshabilitado al 50 % de opacidad. Cargando muestra el spinner en lugar del ícono, conserva el texto y el color y bloquea clics. Foco: contorno global de 2 px en `senal` a 2 px.
- **Botón de ícono:** círculo de 44 px (36 px pequeño), fantasma en `texto-suave` por defecto; siempre con nombre accesible.

### Chips
- **Insignia "En vivo":** cápsula `al-aire` de 24 px con el nodo en vivo de 12 px y "En vivo" en 12 px bold `blanco`.
- **Insignia "Streamer":** cápsula `al-aire` de 20 px, 12 px bold `blanco`, antes del nombre del dueño en el chat. Es el mismo índigo que "En vivo": marca a quien transmite.
- **Espectadores sobre tarjeta:** cápsula de 24 px en `noche` al 80 % con ícono y cifra.

### Cards / Containers
- **Panel:** `panel`, borde `linea`, radio de 20 px, relleno 20/24 px, 16 a 24 px entre bloques internos.
- **Panel de estado al aire:** cuando el canal está en vivo, el panel de estado entero cambia a fondo y borde `al-aire` con texto `blanco` (textos secundarios en `blanco` al 70 a 80 %), en 200 ms. Es el momento propio del estudio.
- **Tarjeta de canal:** como no hay miniaturas de video, el marco 16:9 lleva el avatar de 96 px centrado con su anillo de en vivo, sobre `panel` teñido al 8 % con el tono del username. En tarjetas de menos de 20rem el avatar se reduce al 72 % y sube 10 px para no tapar las insignias, que van abajo a la izquierda. Debajo: nombre en Figtree 700, título en dos líneas y tiempo en vivo. Toda la tarjeta es un enlace; en hover y foco el borde del marco pasa a `senal`.
- **Marco de video:** 16:9 fijo en `pantalla`, con radio de 20 px y borde solo desde 1024 px. Desconectado muestra el avatar y "no está en vivo" en Bricolage; conectando muestra el nodo esperando de 72 px. Los cambios de estado entran con un fundido de 200 ms.

### Inputs / Fields
- **Style:** `relieve`, borde `linea`, radio de 12 px, 44 px de alto, 16 px laterales, texto de 16 px. Etiqueta visible arriba (14 px semibold), ayuda y error debajo, contador a la derecha en 12 px tenue.
- **Focus:** borde a `senal` más contorno de 2 px en `senal` al 50 %; hover lleva el borde a `texto-tenue`.
- **Error / Disabled:** borde `error` y mensaje `error` con ícono de alerta; deshabilitado al 60 %.
- **Campo de copiar:** el valor en mono de 14 px dentro de una caja de campo, con "Mostrar" (fantasma) y "Copiar" (secundario) pequeños; "Copiado" con check `senal` durante 2 s.
- **Código de verificación:** casillas separadas con el mismo estilo de campo.

### Navigation
- **Barra superior:** logo de 28 px a la izquierda; a la derecha, el botón de estudio con el nodo de 12 px ("Transmitir" secundario o "En vivo" `al-aire`), y el menú de usuario o "Iniciar sesión" / "Crear cuenta". En móvil el botón de estudio es solo ícono (círculo de 44 px con el nodo y nombre accesible), "Iniciar sesión" pasa a "Entrar" y "Crear cuenta" se oculta.
- **Pestañas de cuenta:** pista de cápsula en `noche` con borde `linea`; la activa en `relieve` con `texto`, la inactiva en `texto-suave`.

### Chat
Fondo `panel`, cabecera de 48 px con borde inferior. Cada mensaje: nombre en bold en su tono, dos puntos en `texto-suave` y el texto en `texto` en la misma línea, 15 px; hover con `relieve` al 50 %; la hora flota a la derecha y aparece al pasar el mouse. "Mensajes nuevos" es una cápsula `senal` flotante que sube 8 px al aparecer (160 ms).

### Modal, avisos y estados vacíos
- **Modal:** `<dialog>` nativo de 28rem en `panel` con radio de 20 px; entra en 160 ms (opacidad y escala desde 0,98, curva de salida) y sale en 120 ms. Acciones al pie a la derecha, cancelar primero.
- **Aviso:** caja de campo en `relieve` con ícono (`senal` éxito, `error` fallo), abajo a la derecha (abajo al centro en móvil), entra subiendo 8 px en 200 ms.
- **Estado vacío:** el símbolo del logo en contorno (120 px; 72 px en móvil), título Headline, texto de 44ch y una acción.

## Do's and Don'ts

### Do:
- **Do** dibujar el estado del canal con el nodo de anillos y decirlo además en texto.
- **Do** reservar `al-aire` para lo que está en vivo: insignia, insignia "Streamer", botón de la barra y panel del estudio al aire.
- **Do** usar `senal` con texto `noche` para la acción principal y como único color de foco.
- **Do** separar capas con tono (`noche`, `panel`, `relieve`) y bordes de 1 px en `linea`.
- **Do** mantener los marcos de video y de tarjeta en 16:9 en todos los estados para que la página no salte.
- **Do** usar cápsulas para botones e insignias, 12 px para campos y 20 px para paneles.
- **Do** respetar "reducir movimiento": el nodo queda quieto y concéntrico, y las transiciones se anulan.

### Don't:
- **Don't** usar vidrio, desenfoques de fondo, brillos de neón ni degradados.
- **Don't** poner `al-aire` como decoración o color de marca fuera de "en vivo".
- **Don't** añadir otra animación en bucle: el nodo esperando señal es la única.
- **Don't** usar sombras en superficies en reposo ni sombras duras desplazadas.
- **Don't** escribir etiquetas en mayúsculas con interletrado abierto ni poner antetítulos sobre los títulos.
- **Don't** usar `teal` ni los colores `logo-*` fuera del logo.
