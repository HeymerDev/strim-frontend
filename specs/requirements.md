# Strim · Frontend — Requerimientos

> **SDD fase 1 de 3** (Requerimientos → Diseño → Tareas)
> Estado: **aprobado (v1)**, con las propuestas D1 a D5 · Fecha: 2026-10-18

Los criterios usan el formato EARS: **CUANDO** (evento), **SI … ENTONCES** (caso no deseado), **MIENTRAS** (estado), y "la app **DEBERÁ**". Cada criterio tiene un ID (`RF-03.2`) para enlazarlo luego con el diseño y las tareas. Cuando un criterio usa la API, se cita el requerimiento del backend como `back RF-xx` ([backend/specs/requirements.md](../../backend/specs/requirements.md)).

---

## 1. Objetivo

Frontend web de **Strim** ("live sencillo"): los espectadores ven los canales en vivo y comentan en el chat, y el streamer copia sus datos para OBS e inicia o finaliza su stream desde el navegador. Consume la API REST y el Socket.IO del backend, que ya está terminado.

## 2. Alcance

**Incluye**

- Inicio con los canales que están en vivo.
- Página del canal: reproductor HLS, datos del canal y chat en tiempo real.
- Cuentas: crear cuenta, verificar el correo con OTP, iniciar y cerrar sesión, y recuperar la contraseña con OTP.
- Estudio del streamer: estado del stream, título, iniciar y finalizar, y credenciales de OBS.
- Ajustes: editar el perfil y el avatar, cambiar la contraseña en un modal y borrar la cuenta.

**Fuera de alcance** (aunque aparezca en las pantallas de Stitch)

- Todo lo que el backend no tiene: seguir canales, suscripciones, puntos, regalos, buscador, categorías, etiquetas, notificaciones y estadísticas del stream.
- Insignias de moderador, suscriptor o VIP en el chat, emotes y moderación.
- Selector de calidad, barra de progreso o retroceso en el video (es en vivo y sin transcodificación).
- Barra lateral de canales recomendados y las secciones "Explorar" y "Siguiendo".
- Descargar un perfil de OBS (`.ini`) y la guía paso a paso larga.
- Modo claro y otros idiomas además del español.
- Despliegue a producción.

## 3. Stack y restricciones

| Tema | Decisión |
|---|---|
| Framework | React 19 + TypeScript (modo estricto) |
| Build y servidor de desarrollo | Vite, en `http://localhost:5173` (el origen que ya acepta el CORS del backend) |
| Gestor de paquetes | pnpm |
| Tipo de app | SPA: todo se dibuja en el navegador |
| Backend | REST en `/api` y Socket.IO en el mismo host (`http://localhost:4000` en local) |
| Video | HLS que sirve MediaMTX (`http://localhost:8888`) |
| Estructura | `frontend/` (esta spec) y `backend/` (otra sesión) en el mismo directorio |

Las librerías de rutas, estilos, estado y video se eligen en la fase de diseño.

## 4. Referencia visual

El estilo parte del logo (fondo índigo casi negro, círculos cian y azul real) y del proyecto de Stitch **"Strim Streaming Platform WebApp"** (`8032624611439183732`). Se toma como referencia, no como plantilla: el diseño propio se define en la fase 2.

| Pantalla de Stitch | Lo que se toma | Lo que se deja fuera |
|---|---|---|
| Autenticación y OTP | Tarjeta centrada, cambio entre "Iniciar sesión" y "Crear cuenta", ver u ocultar la contraseña | — |
| En vivo: video y chat | Video con el chat al lado, insignia "En vivo", espectadores, tiempo en vivo, datos del streamer | Seguir, suscribirse, compartir, etiquetas, calidad, insignias MOD/SUB/VIP, puntos, regalos, "modo seguro", tarjetas de abajo del video |
| Perfil y seguridad (modal) | Modal que pide la contraseña actual | El aviso "caducará en 5 minutos" |
| Estudio y credenciales OBS | Estado del stream, iniciar y finalizar, título, servidor y clave con copiar y mostrar, regenerar la clave, aviso de no compartir la clave, vista previa | Categoría, etiquetas, notificar seguidores, FPS y kbps, resumen de la sesión, gráfico de audiencia, descargar perfil `.ini` |
| Navegación | Logo, botón para transmitir, iniciar sesión, crear cuenta y menú del usuario | Explorar, Siguiendo, buscador y barra lateral |

## 5. Glosario

Se usan los términos del backend (Usuario, Perfil, Canal, Stream key, OTP, Sala). Además:

| Término | Significado |
|---|---|
| Estudio | Página privada donde el streamer prepara y controla su stream. |
| Tiempo en vivo | Tiempo transcurrido desde `liveStartedAt`. |
| `next` | Ruta a la que se vuelve después de iniciar sesión. |

## 6. Rutas

Las rutas fijas usan palabras que el backend ya reserva como username (D1), así ningún canal puede chocar con ellas.

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/` | Inicio: canales en vivo | Público |
| `/login` | Iniciar sesión | Solo sin sesión |
| `/register` | Crear cuenta | Solo sin sesión |
| `/verify` | Verificar el correo con OTP | Solo sin sesión |
| `/reset` | Recuperar la contraseña | Solo sin sesión |
| `/dashboard` | Estudio | Con sesión |
| `/settings` | Ajustes: perfil y seguridad | Con sesión |
| `/:username` | Canal | Público |
| cualquier otra | Página no encontrada | Público |

## 7. Actores

- **Visitante** (sin sesión): ve el inicio y los canales, y lee el chat.
- **Usuario autenticado**: además comenta, edita sus ajustes y transmite desde su estudio.

---

## 8. Requerimientos funcionales

### RF-01 · Navegación global

1. La app DEBERÁ mostrar en todas las páginas una barra superior con el logo, que lleva a `/`.
2. MIENTRAS no haya sesión, la barra DEBERÁ mostrar "Iniciar sesión" y "Crear cuenta".
3. MIENTRAS haya sesión, la barra DEBERÁ mostrar el avatar del usuario con un menú: "Mi canal", "Estudio", "Ajustes" y "Cerrar sesión".
4. La barra DEBERÁ mostrar el botón "Transmitir", que lleva a `/dashboard`. MIENTRAS el canal del usuario esté `live`, el botón DEBERÁ indicarlo.
5. Las páginas de cuenta (`/login`, `/register`, `/verify`, `/reset`) PODRÁN usar una versión reducida de la barra, solo con el logo.

### RF-02 · Sesión

1. CUANDO se inicia sesión, la app DEBERÁ guardar el access token, el refresh token y su vencimiento (D2).
2. CUANDO la app arranca con una sesión guardada, DEBERÁ cargar el usuario con `GET /api/me` antes de dibujar las rutas privadas (back RF-04.5).
3. La app DEBERÁ renovar el access token con `POST /api/auth/refresh` antes de que venza, y también una vez si una petición responde `UNAUTHORIZED`, repitiendo luego esa petición (back RF-04.3).
4. SI la renovación falla, ENTONCES la app DEBERÁ borrar la sesión y, si la ruta era privada, llevar a `/login`.
5. CUANDO alguien sin sesión abre una ruta privada, la app DEBERÁ llevarlo a `/login?next=<ruta>` y, al iniciar sesión, devolverlo a esa ruta.
6. CUANDO alguien con sesión abre una ruta "solo sin sesión", la app DEBERÁ llevarlo a `/`.
7. CUANDO el usuario pulsa "Cerrar sesión", la app DEBERÁ llamar a `POST /api/auth/logout`, borrar la sesión aunque la llamada falle, reconectar el chat como anónimo y llevar a `/` (back RF-04.4).
8. MIENTRAS haya varias pestañas abiertas, DEBERÁN compartir la sesión: si una inicia o cierra sesión, las demás se actualizan.

### RF-03 · Crear cuenta

**Historia:** Como visitante, quiero crear una cuenta para comentar y transmitir.

1. El formulario DEBERÁ pedir correo, username y contraseña, con un botón para ver u ocultar la contraseña.
2. La app DEBERÁ validar antes de enviar, con las mismas reglas del backend (back RF-01.6 y RNF-04), y mostrar cada error junto a su campo:
   - **Username:** de 3 a 20 caracteres entre `a-z`, `0-9` y `_`. Se convierte a minúsculas mientras se escribe.
   - **Contraseña:** de 8 a 72 caracteres, con al menos una letra y un número. Las reglas se muestran debajo del campo.
3. CUANDO el registro responde que la cuenta queda pendiente de verificar, la app DEBERÁ llevar a `/verify` con el correo (back RF-01.1 y RF-01.4).
4. SI la respuesta es `EMAIL_TAKEN` o `USERNAME_TAKEN`, ENTONCES la app DEBERÁ mostrar el error en el campo correspondiente.

### RF-04 · Verificar el correo con OTP

**Historia:** Como usuario recién registrado, quiero escribir el código que me llegó para activar mi cuenta.

1. La pantalla DEBERÁ mostrar a qué correo se envió el código y un campo para los 6 dígitos que acepte pegar el código completo y use el teclado numérico en móvil.
2. CUANDO se completan los 6 dígitos, la app DEBERÁ enviarlos con `POST /api/auth/verify-email`. Si son correctos, se inicia la sesión y se lleva a `next` o a `/` (back RF-02.1).
3. SI la respuesta es `INVALID_OTP`, ENTONCES la app DEBERÁ mostrar el error y vaciar el campo para escribir de nuevo.
4. La pantalla DEBERÁ ofrecer "Reenviar código", deshabilitado durante 60 s después de cada envío y con la cuenta regresiva visible (back RF-02.3 y RF-02.4).
5. SI se abre `/verify` sin un correo conocido, ENTONCES la app DEBERÁ llevar a `/login`.

### RF-05 · Iniciar sesión

1. El formulario DEBERÁ pedir correo y contraseña, y enlazar a "Crear cuenta" y a "¿Olvidaste tu contraseña?".
2. CUANDO las credenciales son correctas, la app DEBERÁ iniciar la sesión y llevar a `next` o a `/` (back RF-03.1).
3. SI la respuesta es `INVALID_CREDENTIALS`, ENTONCES la app DEBERÁ mostrar un error general, sin marcar un campo en particular (back RF-03.2).
4. SI la respuesta es `EMAIL_NOT_VERIFIED`, ENTONCES la app DEBERÁ pedir un código nuevo con `POST /api/auth/resend-otp` y llevar a `/verify` con ese correo (back RF-03.3).

### RF-06 · Recuperar la contraseña

**Historia:** Como usuario que olvidó su contraseña, quiero restablecerla con un código que llega a mi correo.

1. **Paso 1:** CUANDO el usuario envía su correo, la app DEBERÁ llamar a `POST /api/auth/password/forgot` y mostrar siempre el mismo mensaje: si existe una cuenta con ese correo, se envió un código (back RF-05.1).
2. **Paso 2:** la app DEBERÁ pedir el código de 6 dígitos y la contraseña nueva (con las reglas de RF-03.2) y enviarlos con `POST /api/auth/password/reset`.
3. SI la respuesta es `INVALID_OTP`, ENTONCES la app DEBERÁ mostrar el error en el campo del código.
4. CUANDO el cambio funciona, la app DEBERÁ llevar a `/login` con el correo ya escrito y el aviso "Contraseña actualizada. Inicia sesión" (back RF-05.4).
5. El paso 2 DEBERÁ ofrecer "Reenviar código" con la misma espera de 60 s de RF-04.4.

### RF-07 · Inicio: canales en vivo

**Historia:** Como espectador, quiero ver quién está transmitiendo ahora y entrar a su canal.

1. La app DEBERÁ mostrar los canales de `GET /api/channels/live`, en el orden que llegan (más espectadores primero) (back RF-17).
2. Cada canal DEBERÁ mostrar avatar, nombre visible, título, espectadores, tiempo en vivo y la insignia "En vivo", y llevar a `/:username` (D3).
3. SI no hay canales en vivo, ENTONCES la app DEBERÁ mostrar un estado vacío que invite a transmitir, con un enlace a `/dashboard`.
4. MIENTRAS se carga, la app DEBERÁ mostrar el espacio de las tarjetas sin que la página salte. SI la carga falla, ENTONCES DEBERÁ mostrar el error y un botón "Reintentar".
5. La lista DEBERÁ actualizarse cada 30 s y al volver a la pestaña.

### RF-08 · Canal

**Historia:** Como espectador, quiero abrir el canal de un streamer para ver su stream y su chat.

1. La app DEBERÁ mostrar avatar, nombre visible, `@username`, bio y título del canal de `GET /api/channels/:username` (back RF-13).
2. MIENTRAS el canal esté en vivo, la app DEBERÁ mostrar el reproductor (RF-09), la insignia "En vivo", los espectadores y el tiempo en vivo, que avanza cada segundo.
3. MIENTRAS el canal no esté en vivo, la app DEBERÁ mostrar en el lugar del video un estado "Desconectado" con el nombre del streamer. El chat sigue disponible (back RF-14.6).
4. CUANDO llega `stream:status`, la app DEBERÁ pasar entre el reproductor y el estado "Desconectado" sin recargar la página.
5. CUANDO llegan `stream:title` o `viewers:count`, la app DEBERÁ actualizar el título o los espectadores.
6. CUANDO llega `channel:deleted`, la app DEBERÁ detener el video, cerrar el chat y mostrar que el canal ya no existe.
7. SI el username no existe (`NOT_FOUND`), ENTONCES la app DEBERÁ mostrar la página no encontrada.
8. MIENTRAS el visitante sea el dueño del canal, la app DEBERÁ mostrar un enlace "Ir al estudio".
9. En escritorio el chat DEBERÁ ir a la derecha del video. En móvil, el video arriba y el chat debajo, ocupando el resto de la pantalla.

### RF-09 · Reproductor

1. La app DEBERÁ reproducir el `playbackUrl` HLS del canal, con hls.js o con el HLS nativo del navegador cuando lo tenga (Safari).
2. CUANDO el video empieza, la app DEBERÁ reproducirlo en silencio (los navegadores bloquean el autoplay con sonido) y mostrar un botón visible "Activar sonido".
3. El reproductor DEBERÁ tener play/pausa, silencio, volumen y pantalla completa, todos usables con teclado.
4. La app DEBERÁ recordar en el navegador el volumen y si el usuario quitó el silencio.
5. SI el video todavía no está disponible o se corta mientras el canal sigue en vivo, ENTONCES la app DEBERÁ mostrar "Conectando…" y reintentar cada pocos segundos, sin mostrar el error técnico.

### RF-10 · Chat: lectura

**Historia:** Como espectador, con o sin sesión, quiero leer el chat en tiempo real.

1. La app DEBERÁ mantener una sola conexión de Socket.IO, con el token si hay sesión y sin token si no (back RF-14.4).
2. CUANDO se abre un canal, la app DEBERÁ emitir `chat:join` y mostrar los últimos 50 mensajes que devuelve. CUANDO se sale del canal, DEBERÁ emitir `chat:leave` (back RF-14.1 a RF-14.3).
3. CUANDO llega `chat:message`, la app DEBERÁ agregarlo al final con el nombre visible del autor y su texto. La hora se ve al pasar el mouse o al enfocar el mensaje.
4. Los mensajes del dueño del canal DEBERÁN llevar la insignia "Streamer".
5. El texto DEBERÁ mostrarse siempre como texto plano, nunca como HTML.
6. MIENTRAS el usuario esté al final del chat, la app DEBERÁ bajar sola con cada mensaje nuevo. SI el usuario subió para leer, ENTONCES la app NO DEBERÁ moverlo y DEBERÁ mostrar un botón "Mensajes nuevos" que baja al final.
7. MIENTRAS la conexión esté caída, la app DEBERÁ mostrar "Reconectando…". CUANDO vuelve, DEBERÁ repetir `chat:join` y cargar de nuevo los últimos mensajes.
8. CUANDO se renueva el access token, la app DEBERÁ reconectar el socket con el token nuevo y volver a unirse a la sala.
9. La app DEBERÁ guardar en memoria como máximo los últimos 200 mensajes de la sala.

### RF-11 · Chat: escribir

**Historia:** Como usuario autenticado, quiero comentar en el chat de cualquier canal, incluido el mío.

1. MIENTRAS no haya sesión, en lugar del campo de texto la app DEBERÁ mostrar "Inicia sesión para comentar", que lleva a `/login?next=/<username>`.
2. MIENTRAS haya sesión, la app DEBERÁ mostrar un campo de texto de hasta 300 caracteres que se envía con Enter o con un botón (back RF-15.3). Cerca del límite DEBERÁ mostrar cuántos caracteres quedan.
3. El botón de enviar DEBERÁ estar deshabilitado si el texto queda vacío después de quitar los espacios.
4. CUANDO el servidor confirma el mensaje, la app DEBERÁ vaciar el campo. El mensaje aparece una sola vez, cuando llega `chat:message`.
5. SI la respuesta es `RATE_LIMITED`, ENTONCES la app DEBERÁ mostrar "Vas muy rápido" junto al campo y conservar el texto (back RF-15.4).
6. SI la respuesta es `UNAUTHORIZED` o `AUTH_REQUIRED` teniendo sesión, ENTONCES la app DEBERÁ renovar el token, reconectar y reintentar el envío una vez (back RF-15.5).

### RF-12 · Estudio

**Historia:** Como streamer, quiero ver mis datos para OBS y controlar mi stream desde un solo lugar.

1. La app DEBERÁ cargar el estudio con `GET /api/stream` y mantenerlo al día con el evento `stream:state` (back RF-09.2).
2. La app DEBERÁ mostrar el estado del canal con un texto claro:
   - `offline`: "Desconectado".
   - `waiting`: "Esperando la señal de OBS", con la indicación de iniciar la transmisión en OBS.
   - `live`: "En vivo", con el tiempo en vivo.
3. La app DEBERÁ mostrar un campo de título de hasta 100 caracteres con un botón "Guardar título" (`PATCH /api/stream`), disponible en cualquier estado (back RF-10.4).
4. MIENTRAS el canal esté `offline`, la app DEBERÁ mostrar "Iniciar stream", que envía el título escrito (`POST /api/stream/start`) (back RF-10.1).
5. MIENTRAS el canal esté `waiting` o `live`, la app DEBERÁ mostrar "Finalizar stream" (`POST /api/stream/stop`). SI el canal está `live`, ENTONCES DEBERÁ pedir confirmación antes (back RF-10.3).
6. La app DEBERÁ mostrar el servidor y la clave de OBS, cada uno con un botón "Copiar" que confirma "Copiado". La clave DEBERÁ estar oculta por defecto, con un botón para mostrarla (back RF-09.5).
7. La app DEBERÁ mostrar una guía corta para OBS: Ajustes → Emisión → Servicio "Personalizado", pegar el servidor y la clave, e intervalo de fotogramas clave de 2 s.
8. CUANDO el streamer pulsa "Regenerar clave", la app DEBERÁ pedir confirmación avisando que la clave anterior deja de servir, y luego llamar a `POST /api/stream/key` (back RF-09.3).
9. MIENTRAS el canal no esté `offline`, "Regenerar clave" DEBERÁ estar deshabilitado, con la razón visible (back RF-09.4).
10. MIENTRAS el canal esté `live`, la app DEBERÁ mostrar una vista previa del stream en silencio (D4).
11. La app DEBERÁ mostrar un enlace "Ver mi canal", que abre `/<username>` en otra pestaña, donde el streamer lee su chat (D4).

### RF-13 · Ajustes: perfil

**Historia:** Como usuario autenticado, quiero editar cómo me ven en mi canal y en el chat.

1. La app DEBERÁ mostrar el avatar, el nombre visible (1 a 30 caracteres), el username, la bio (0 a 200, con contador) y el correo, este último sin poder editarse (back RF-06.1 y RF-06.6).
2. CUANDO el usuario elige una imagen, la app DEBERÁ comprobar que sea JPG, PNG o WebP de hasta 2 MB, mostrar la vista previa y subirla con `PUT /api/me/avatar`. SI no cumple, ENTONCES DEBERÁ explicar por qué sin enviarla (back RF-06.4 y RF-06.5).
3. SI el usuario no tiene avatar, ENTONCES la app DEBERÁ mostrar sus iniciales, aquí y en todo el sitio.
4. El botón "Guardar cambios" DEBERÁ habilitarse solo si hay cambios, y enviar solo los campos cambiados con `PATCH /api/me`.
5. MIENTRAS el canal no esté `offline`, el campo username DEBERÁ estar deshabilitado, con la razón visible (back RF-06.3).
6. SI la respuesta es `USERNAME_TAKEN`, ENTONCES la app DEBERÁ mostrar el error en el campo username.
7. CUANDO se guardan los cambios, la app DEBERÁ avisar "Cambios guardados" y actualizar el avatar y el nombre en la barra superior.

### RF-14 · Ajustes: cambiar la contraseña

1. CUANDO el usuario pulsa "Cambiar contraseña", la app DEBERÁ abrir un modal que pide la contraseña actual y la nueva (con las reglas de RF-03.2) (back RF-07).
2. SI la respuesta es `INVALID_CURRENT_PASSWORD`, ENTONCES la app DEBERÁ mostrar el error en el campo de la contraseña actual y mantener el modal abierto.
3. SI la respuesta es `SAME_PASSWORD`, ENTONCES la app DEBERÁ mostrar el error en el campo de la nueva.
4. SI la respuesta es `TOO_MANY_REQUESTS`, ENTONCES la app DEBERÁ pedir que espere unos minutos.
5. CUANDO el cambio funciona, la app DEBERÁ cerrar el modal y avisar "Contraseña actualizada". La sesión sigue abierta.

### RF-15 · Ajustes: borrar la cuenta

1. La app DEBERÁ mostrar "Borrar cuenta" separado del resto de los ajustes y con aspecto de acción destructiva.
2. CUANDO el usuario lo pulsa, la app DEBERÁ abrir un modal que explique que se borran el perfil, el canal y los mensajes, que no se puede deshacer, y que pida la contraseña (back RF-08).
3. SI la respuesta es `INVALID_CURRENT_PASSWORD` o `TOO_MANY_REQUESTS`, ENTONCES la app DEBERÁ mostrar el error en el modal.
4. CUANDO el borrado funciona, la app DEBERÁ borrar la sesión, llevar a `/` y avisar "Tu cuenta se borró".

### RF-16 · Errores, carga y avisos

1. La app DEBERÁ mostrar el `message` en español que manda el backend. Los errores de un campo (`VALIDATION_ERROR` con `details`) van junto a ese campo.
2. SI el backend no responde, ENTONCES la app DEBERÁ mostrar "No pudimos conectar con el servidor" con una forma de reintentar.
3. MIENTRAS una acción esté en curso, su botón DEBERÁ mostrar que está cargando y no aceptar otro clic.
4. Las confirmaciones de éxito DEBERÁN mostrarse como avisos breves que no tapan el contenido ni roban el foco.
5. Las rutas desconocidas y los canales inexistentes DEBERÁN mostrar una página no encontrada con un enlace al inicio.

---

## 9. Requerimientos no funcionales

**RNF-01 · Stack**
React 19, TypeScript en modo estricto, Vite y pnpm (sección 3). Scripts: `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm typecheck` y `pnpm lint`.

**RNF-02 · Integración**
- La app solo habla con el backend (REST y Socket.IO) y con MediaMTX (video). Nunca llama a Supabase.
- La URL del backend se configura con una variable de entorno de Vite. `.env.example` se versiona y `.env` se ignora.
- Los tipos de las respuestas siguen los de la sección 6 del diseño del backend.

**RNF-03 · Seguridad**
- El texto del chat y de los perfiles se muestra como texto, nunca como HTML.
- La stream key solo aparece en el estudio, oculta por defecto, y nunca en la URL ni en la consola.
- El parámetro `next` solo acepta rutas internas de la app.

**RNF-04 · Responsive**
Funciona desde 360 px de ancho hasta escritorio, sin scroll horizontal. En móvil los controles táctiles miden al menos 44 × 44 px.

**RNF-05 · Accesibilidad**
WCAG 2.1 AA:
- Contraste de al menos 4,5:1 en el texto y 3:1 en los controles.
- Todo se puede usar con teclado, con el foco siempre visible.
- Los campos tienen etiqueta visible, y los botones de solo icono tienen nombre accesible.
- Los modales atrapan el foco, se cierran con Escape y devuelven el foco al botón que los abrió.
- El chat usa una región que los lectores de pantalla anuncian sin interrumpir.
- Si el sistema pide reducir el movimiento, se quitan las animaciones no esenciales.

**RNF-06 · Idioma y textos**
Todo en español, en un tono claro y directo. Los botones dicen lo que hacen ("Iniciar stream", "Guardar cambios"), y la misma acción tiene el mismo nombre en toda la app.

**RNF-07 · Identidad visual**
Solo modo oscuro, con la identidad del logo y la sección 4 como referencia. Los colores, la tipografía y los componentes se definen en la fase de diseño.

**RNF-08 · Rendimiento**
- El código del reproductor se carga solo en las páginas que lo usan (canal y estudio).
- Al cargar las páginas no hay saltos de contenido.
- Las fuentes no bloquean el primer dibujo.

**RNF-09 · Navegadores**
Últimas 2 versiones de Chrome, Edge, Firefox y Safari, en escritorio y móvil.

---

## 10. Dependencias y supuestos

- **Backend** corriendo en local según su README (`npm run dev` y `npm run media:up`), con `FRONTEND_URL=http://localhost:5173`.
- **MediaMTX** sirve el HLS con CORS para el origen del frontend.
- **Contrato de la API:** las rutas, los eventos del socket y los códigos de error son los de [backend/specs/design.md](../../backend/specs/design.md) (secciones 6, 7 y 9). Si el frontend necesita un cambio en el backend, se pide en la sesión del backend.
- **Imágenes:** el backend no genera miniaturas del video, solo hay avatares.

## 11. Decisiones para confirmar

| # | Pregunta | Propuesta | Alternativa |
|---|---|---|---|
| D1 | ¿En qué idioma van las rutas fijas? | En inglés (`/login`, `/register`, `/verify`, `/reset`, `/dashboard`, `/settings`): el backend ya las reserva como username, así ningún canal choca con ellas. | En español (`/estudio`, `/ajustes`…), agregando esas palabras a los usernames reservados del backend (cambio en la otra sesión). |
| D2 | ¿Dónde se guarda la sesión? | En `localStorage`: sobrevive al cerrar el navegador y se comparte entre pestañas (RF-02.8). El riesgo de XSS se reduce mostrando todo como texto (RNF-03). | En `sessionStorage`: hay que iniciar sesión en cada pestaña nueva. |
| D3 | ¿Qué muestra cada tarjeta del inicio, si no hay miniaturas? | Avatar grande, nombre, título y espectadores, sin video. | Además, una vista previa del video en silencio al pasar el mouse (más peticiones al servidor de video). |
| D4 | ¿El estudio tiene vista previa y chat? | Vista previa en silencio cuando está en vivo, y el chat se lee en el canal ("Ver mi canal"). | También el chat dentro del estudio, al lado de los controles. |
| D5 | ¿Pruebas automatizadas? | No por ahora: TypeScript, ESLint y una lista de pruebas manuales en las tareas, como en el backend. | Vitest + Testing Library para la sesión y el chat. |
