# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + TypeScript + Vite, con pnpm (elegido por el usuario). SPA que consume el backend de `../backend` (REST, Socket.IO y HLS de MediaMTX).

## Users

- **Espectadores**, con o sin cuenta: abren un canal desde un enlace o desde el inicio para ver el stream y leer el chat; con cuenta, también comentan. Suelen mirar de noche, en laptop o en el celular.
- **Streamers**: transmiten desde OBS en su computadora. Usan el estudio con OBS abierto al lado para copiar el servidor y la clave, iniciar o finalizar el stream y cambiar el título.

## Product Purpose

Strim es una plataforma de streaming minimalista tipo Kick: transmitir desde OBS y conversar en un chat en vivo, nada más. Éxito: un streamer nuevo pasa de crear su cuenta a estar en vivo en pocos minutos, y un espectador entra a un canal y ve el video y el chat sin fricción.

## Positioning

"Live sencillo": solo lo esencial de un stream (video, chat y estado en vivo). No hay seguir, suscripciones, puntos, categorías ni recomendaciones, y esa ausencia es la propuesta.

## Operating Context

- El streamer configura OBS en Ajustes → Emisión → Servicio "Personalizado". Debe pulsar "Iniciar stream" en el estudio antes de iniciar la transmisión en OBS.
- El paso a "en vivo" tarda unos segundos (el backend revisa cada 3 s, más el retraso propio del HLS).
- Cualquiera lee el chat; solo quien tiene sesión comenta.
- En local: backend en `:4000`, video HLS en `:8888` y frontend en `:5173`.

## Capabilities and Constraints

- Funciones: inicio con los canales en vivo, canal (video y chat), cuentas con OTP por correo, estudio con credenciales de OBS y ajustes (perfil, avatar, contraseña y borrar la cuenta). El detalle está en `specs/requirements.md`.
- Un canal por usuario, en `/<username>`.
- El backend no genera miniaturas del video: solo hay avatares.
- Solo español y solo modo oscuro.
- No existen: seguir canales, suscripciones, búsqueda, categorías, etiquetas, grabaciones, moderación ni estadísticas.

## Brand Commitments

- Nombre: **strim**, siempre en minúsculas. Lema: "live sencillo".
- Logo: símbolo de cuatro nodos circulares en cuadrícula de 2 × 2 (dos cian, uno azul real y uno de anillos concéntricos) junto a la palabra "strim". Colores aproximados: fondo índigo casi negro `#1b1930`, cian `#0ec2e1`, azul real `#1900b3` y la palabra en teal `#0098b3`.
- Referencia de estilo elegida por el usuario: el proyecto de Stitch "Strim Streaming Platform WebApp" (`8032624611439183732`), como base y no como copia.

## Evidence on Hand

- El logo en PNG (2000 × 2000 y 512 × 512). No hay SVG.
- Cuatro pantallas de referencia en Stitch.
- No hay canales, usuarios ni cifras reales: la interfaz no inventa espectadores, seguidores ni testimonios.

## Product Principles

1. Lo que no ayuda a ver, comentar o transmitir no entra.
2. El estado del canal (desconectado, esperando señal o en vivo) se entiende de un vistazo.
3. El video manda: la interfaz se aparta del contenido.
4. Cada error dice qué pasó y cómo seguir.

## Accessibility & Inclusion

WCAG 2.1 AA (RNF-05 de los requerimientos): contraste de 4,5:1, uso completo con teclado y foco visible, y se respeta la preferencia de reducir el movimiento.
