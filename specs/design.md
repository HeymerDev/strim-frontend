# Strim · Frontend — Diseño

> **SDD fase 2 de 3** (Requerimientos → Diseño → Tareas)
> Estado: **aprobado (v1)**, con las propuestas D1 a D4 · Fecha: 2026-10-19
> Parte de [requirements.md](requirements.md) v1, aprobado con D1 a D5. El contexto de producto está en [PRODUCT.md](../PRODUCT.md).

---

## 1. Arquitectura

```
                 ┌──────────── Navegador (SPA React) ─────────────┐
                 │  Router · TanStack Query · sesión · socket     │
                 └───────┬──────────────────┬──────────────┬──────┘
          REST /api      │      Socket.IO   │   HLS (.m3u8)│
                         ▼                  ▼              ▼
                 Backend Express :4000 (mismo host)   MediaMTX :8888
```

| Pieza | Responsabilidad |
|---|---|
| Router | Rutas, layouts y guardas de sesión (sección 4). |
| Cliente de API | `fetch` con el token, errores con su código y renovación del token (sección 5). |
| Sesión | Tokens y usuario en `localStorage`, compartidos entre pestañas (sección 5). |
| TanStack Query | Caché de los datos del servidor: `me`, canales, canal y estudio. |
| Socket | Una conexión de Socket.IO para toda la app: chat y avisos del stream (sección 6). |
| Reproductor | hls.js cargado solo donde hay video (sección 7). |

## 2. Decisiones técnicas

| Tema | Decisión | Motivo |
|---|---|---|
| Base | React 19, TypeScript estricto, Vite 7 y pnpm | Requerimientos §3. |
| Rutas | React Router 7 (`createBrowserRouter`) | Layouts anidados y carga diferida de páginas con `lazy`. |
| Datos del servidor | TanStack Query 5 | Da hecho lo de RF-07.5 (actualizar cada 30 s y al volver a la pestaña), los estados de carga y error, y una caché que el socket puede actualizar. |
| Estado de la sesión | Módulo propio con `useSyncExternalStore` | Son tres datos y un evento `storage`. No hace falta una librería de estado. |
| Formularios | react-hook-form + zod 4 | Errores por campo, foco en el primer error y las mismas reglas que el backend (que también usa zod 4). |
| Estilos | Tailwind CSS 4 con los tokens en `@theme` (D4) | Los tokens de la sección 9 quedan como variables CSS y las clases en el mismo componente. |
| Modales | `<dialog>` nativo con `showModal()` | Atrapa el foco, cierra con Escape y devuelve el foco sin dependencias. |
| Menú del usuario | Botón con `aria-expanded` y una lista de enlaces | Es navegación, no un menú de comandos. Cierra con Escape y al hacer clic afuera. |
| Tiempo real | socket.io-client 4 | El backend usa Socket.IO 4. |
| Video | hls.js 1, importado de forma dinámica | Solo se descarga en el canal y en el estudio (RNF-08). En Safari se usa el HLS nativo si hls.js no puede. |
| Íconos | lucide-react | SVG, se importan uno por uno. |
| Fuentes | `@fontsource-variable` (servidas por la app) | Sin peticiones a Google Fonts y con `font-display: swap` (RNF-08). |
| Pruebas | Vitest 5 + React Testing Library (desde la tarea 18) | Al principio no había pruebas automatizadas (D5). El 2026-10-26 se agregaron pruebas unitarias en `test/unit/`, escritas por el agente `frontend-unit-tests` (`.claude/agents/`), con jsdom y todo lo externo simulado. |

## 3. Estructura de carpetas

```
frontend/
├── PRODUCT.md                    contexto de producto (impeccable)
├── specs/                        requirements.md · design.md · tasks.md
├── index.html
├── package.json · pnpm-lock.yaml
├── vite.config.ts · tsconfig*.json · eslint.config.js
├── .env.example
├── public/favicon.svg            el símbolo de los cuatro nodos
└── src/
    ├── main.tsx                  monta la app y los proveedores
    ├── router.tsx                rutas, layouts y guardas
    ├── styles.css                Tailwind, @font-face y tokens (@theme)
    ├── lib/
    │   ├── api.ts                cliente HTTP, ApiError y llamadas a cada ruta
    │   ├── session.ts            store de la sesión y renovación del token
    │   ├── socket.ts             la conexión única de Socket.IO
    │   ├── queries.ts            claves y hooks de TanStack Query
    │   ├── types.ts              tipos de la API y del socket (copiados del backend)
    │   ├── validation.ts         esquemas zod
    │   └── format.ts             tiempo en vivo, espectadores, horas e iniciales
    ├── components/               piezas de UI sin lógica de negocio (sección 9.8)
    ├── layout/                   TopBar, UserMenu, AppLayout, AuthLayout, RequireAuth, GuestOnly
    ├── features/
    │   ├── chat/                 useChatRoom, ChatPanel, ChatMessage, ChatComposer
    │   └── player/               LivePlayer y sus controles
    └── pages/                    Home, Login, Register, Verify, Reset, Channel, Dashboard, Settings, NotFound
```

**Reglas**
- `components/` no llama a la API ni al socket: recibe props.
- Las páginas usan los hooks de `lib/queries.ts` y de `features/`. Nadie llama a `fetch` directo.
- Los tipos de `lib/types.ts` se copian de la sección 6 del diseño del backend y de `backend/src/sockets/types.ts`. Si el backend cambia, se actualizan a mano.

## 4. Rutas y layouts

| Ruta | Página | Layout | Guarda | Carga |
|---|---|---|---|---|
| `/` | `HomePage` | `AppLayout` | — | inmediata |
| `/login` | `LoginPage` | `AuthLayout` | `GuestOnly` | inmediata |
| `/register` | `RegisterPage` | `AuthLayout` | `GuestOnly` | inmediata |
| `/verify` | `VerifyPage` | `AuthLayout` | `GuestOnly` | inmediata |
| `/reset` | `ResetPage` | `AuthLayout` | `GuestOnly` | inmediata |
| `/dashboard` | `DashboardPage` | `AppLayout` | `RequireAuth` | diferida |
| `/settings` | `SettingsPage` | `AppLayout` | `RequireAuth` | diferida |
| `/:username` | `ChannelPage` | `AppLayout` | — | diferida |
| `*` | `NotFoundPage` | `AppLayout` | — | inmediata |

- **`AppLayout`:** barra superior completa, `<main id="contenido">` y la zona de avisos.
- **`AuthLayout`:** solo el logo arriba y una columna centrada de 400 px (RF-01.5).
- **`RequireAuth`:** mientras la sesión se comprueba muestra un indicador de carga; sin sesión lleva a `/login?next=<ruta>` (RF-02.5).
- **`GuestOnly`:** con sesión lleva a `/` (RF-02.6).
- **`/:username`:** si el parámetro no cumple `^[a-z0-9_]{3,20}$` se muestra `NotFoundPage` sin llamar a la API. Si viene con mayúsculas, se redirige a la versión en minúsculas.
- **`next`:** `safeNext()` solo acepta rutas que empiezan con `/` y no con `//`. Si no, usa `/` (RNF-03).
- Cada página pone su `document.title`, por ejemplo `Estudio | strim`.
- `/verify` recibe el correo en el `state` de la navegación. Si se recarga la página, lo lee de `sessionStorage` (`strim.pendingEmail`). Si no hay correo, lleva a `/login` (RF-04.5).

## 5. Sesión y API

### 5.1 Store de la sesión (`lib/session.ts`)

```ts
type Session = { accessToken: string; refreshToken: string; expiresAt: string; user: Me }
type SessionState = { status: 'checking' | 'ready'; session: Session | null }
```

- Se guarda en `localStorage` con la clave `strim.session` (D2 de los requerimientos).
- `getSession()`, `setSession()`, `clearSession()` y `subscribe()`. Los componentes lo leen con `useSession()` (`useSyncExternalStore`).
- **Entre pestañas:** escucha el evento `storage`. Si otra pestaña inicia o cierra sesión, esta adopta el cambio (RF-02.8).
- **Al arrancar** (RF-02.2): si hay sesión guardada, el estado es `checking` y se llama a `GET /api/me`. Al responder pasa a `ready` con el usuario al día. Si falla con 401 y la renovación también falla, se borra la sesión. Las páginas públicas se dibujan enseguida con el usuario guardado. Solo `RequireAuth` espera.
- **Renovación programada** (RF-02.3): un temporizador renueva 60 s antes de `expiresAt`.
- **Renovación única:** `refreshSession()` comparte una sola promesa si la piden varias llamadas a la vez. Antes de llamar al backend relee `localStorage`: si otra pestaña ya renovó, usa esos tokens.
- Al cambiar el access token se avisa al socket para que se reconecte con el nuevo (sección 6).

### 5.2 Cliente HTTP (`lib/api.ts`)

```ts
class ApiError extends Error { status: number; code: ErrorCode | 'NETWORK_ERROR'; details?: Record<string, string> }
```

1. Arma la URL con `VITE_API_URL` + `/api` + la ruta.
2. Si hay sesión, agrega `Authorization: Bearer <accessToken>`.
3. Si la respuesta no es 2xx, lanza `ApiError` con el `error` del cuerpo (RNF-06 del backend).
4. Si la respuesta es 401 `UNAUTHORIZED` en una ruta con token, llama a `refreshSession()` y repite la petición una vez. Si la renovación falla, borra la sesión y lanza el error (RF-02.3 y RF-02.4).
5. Si `fetch` falla (servidor apagado o sin red), lanza `NETWORK_ERROR` con el mensaje "No pudimos conectar con el servidor." (RF-16.2).
6. El avatar va como `FormData` con el campo `avatar`, sin `Content-Type` a mano.

Funciones exportadas, una por ruta de la sección 6 del backend: `register`, `verifyEmail`, `resendOtp`, `login`, `refresh`, `logout`, `forgotPassword`, `resetPassword`, `getMe`, `updateMe`, `uploadAvatar`, `changePassword`, `deleteAccount`, `getStream`, `regenerateKey`, `startStream`, `stopStream`, `updateTitle`, `getLiveChannels` y `getChannel`.

### 5.3 Consultas (`lib/queries.ts`)

| Clave | Fuente | Se actualiza con |
|---|---|---|
| `['me']` | `GET /api/me` | Mutaciones de ajustes y `stream:state` (estado del canal en la barra, RF-01.4). |
| `['channels', 'live']` | `GET /api/channels/live` | `refetchInterval: 30_000` y `refetchOnWindowFocus` (RF-07.5). |
| `['channel', username]` | `GET /api/channels/:username` | `chat:join`, `stream:status`, `stream:title` y `viewers:count` (RF-08.4 y RF-08.5). |
| `['stream']` | `GET /api/stream` | Mutaciones del estudio y `stream:state` (RF-12.1). |

- Reintentos: 1 para consultas, 0 para mutaciones. Un `NOT_FOUND` no se reintenta.
- Al cerrar sesión se vacía la caché, salvo `['channels', 'live']`.

### 5.4 Errores en formularios

Cada formulario pasa sus errores de la API a `setError` de react-hook-form:

| Código | Campo |
|---|---|
| `EMAIL_TAKEN` | `email` |
| `USERNAME_TAKEN` | `username` |
| `INVALID_OTP` | `otp` |
| `INVALID_CURRENT_PASSWORD` | `currentPassword` (o `password` al borrar la cuenta) |
| `SAME_PASSWORD` | `newPassword` |
| `CHANNEL_LIVE` | `username` |
| `VALIDATION_ERROR` | cada clave de `details` |
| cualquier otro | error general arriba del botón, con `role="alert"` |

El texto es siempre el `message` del backend, que ya viene en español (RF-16.1).

## 6. Tiempo real (`lib/socket.ts` y `features/chat/`)

### 6.1 Conexión única

- `io(VITE_API_URL, { autoConnect: false, auth: (cb) => cb(token ? { token } : {}) })`. La función de `auth` lee el token en cada intento, así cada reconexión usa el último (RF-10.1).
- Se conecta al arrancar la app. Cuando cambia la sesión (login, logout o renovación) se hace `disconnect()` + `connect()` (RF-10.8).
- **`connect_error` con `UNAUTHORIZED`:** Socket.IO no reintenta solo cuando el servidor rechaza la conexión. La app llama a `refreshSession()` y vuelve a conectar. Si la renovación falla, borra la sesión y conecta como anónimo.
- El socket del dueño queda en la sala `user:<id>` por el backend, así el estudio y la barra reciben `stream:state` sin unirse a nada.

### 6.2 `useChatRoom(username)`

```ts
type ChatRoom = {
  status: 'joining' | 'ready' | 'reconnecting' | 'deleted'
  messages: ChatMessage[]                  // máximo 200 (RF-10.9)
  send: (content: string) => Promise<SendResult>
}
```

1. Al montar, y en cada evento `connect`, emite `chat:join { username }`. El ack trae los últimos 50 mensajes, que reemplazan a los que había, y el canal, que se guarda en `['channel', username]` (RF-10.2 y RF-10.7).
2. `chat:message` agrega al final y recorta a 200.
3. `stream:status`, `stream:title` y `viewers:count` actualizan `['channel', username]` con `setQueryData`.
4. `channel:deleted` pasa a `deleted` (RF-08.6).
5. `disconnect` pasa a `reconnecting` (RF-10.7).
6. Al desmontar, emite `chat:leave` y quita sus listeners.
7. `send()`: emite `chat:send` y espera el ack. Con `RATE_LIMITED` devuelve el error para mostrarlo. Con `UNAUTHORIZED` o `AUTH_REQUIRED` teniendo sesión, renueva, espera el `connect` y el nuevo `join`, y reintenta una vez (RF-11.6). El mensaje no se agrega al recibir el ack, sino cuando llega su `chat:message` (RF-11.4).

Los mensajes viven en el estado del hook y no en un contexto, para no redibujar toda la página con cada uno.

### 6.3 Desplazamiento del chat (RF-10.6)

- Se considera que el usuario está al final si la distancia al fondo es menor a 48 px.
- Al llegar un mensaje: si estaba al final, baja. Si no, muestra el botón "Mensajes nuevos" sobre el campo de texto.
- La lista usa `role="log"` y `aria-live="polite"` con la etiqueta "Mensajes del chat" (RNF-05).

## 7. Reproductor (`features/player/`)

`<LivePlayer src muted? preview? />` se carga con `React.lazy`.

1. Si `Hls.isSupported()`, usa hls.js con `lowLatencyMode: true` (MediaMTX sirve LL-HLS por defecto). Si no, y el navegador reproduce `application/vnd.apple.mpegurl`, usa `video.src` (iOS).
2. **Autoplay** (RF-09.2): arranca en silencio y llama a `play()`. Si el usuario había quitado el silencio antes (RF-09.4), primero intenta con sonido y, si el navegador lo bloquea, vuelve al silencio. Mientras esté en silencio se ve el botón "Activar sonido" arriba a la izquierda.
3. **Reintentos** (RF-09.5): un error fatal de red (por ejemplo, el 404 que da MediaMTX hasta que la señal está lista) destruye la instancia, muestra "Conectando…" y reintenta a los 2, 4 y luego cada 8 s, mientras el canal siga en vivo.
4. **Controles** (RF-09.3): play/pausa, silencio, volumen (`input type="range"`) y pantalla completa. Se ven al pasar el mouse, al tocar o al enfocar, y siempre mientras está en pausa. Atajos con el reproductor enfocado: espacio o `k` para pausa, `m` para silencio y `f` para pantalla completa.
5. **Preferencias:** `localStorage` `strim.player` = `{ volume, muted }`.
6. **Vista previa** (`preview`): sin controles, siempre en silencio y sin "Activar sonido". La usa el estudio (RF-12.10). Como `StreamDashboard` no trae `playbackUrl`, el estudio lo pide con `['channel', username]` mientras está en vivo.
7. Al desmontar o cambiar `src`, llama a `hls.destroy()`.

El marco del video siempre mide 16:9, esté en vivo o no, para que la página no salte al cambiar de estado.

## 8. Validación (`lib/validation.ts`)

Esquemas zod con las mismas reglas del backend, usados por react-hook-form:

| Esquema | Regla |
|---|---|
| `email` | Formato de correo. |
| `username` | `^[a-z0-9_]{3,20}$`. El campo convierte a minúsculas al escribir. |
| `password` | De 8 a 72 caracteres, con al menos una letra y un número. |
| `otp` | Exactamente `OTP_LENGTH` dígitos (`VITE_OTP_LENGTH`, de 6 a 10; por defecto 8). |
| `displayName` | De 1 a 30 caracteres, sin espacios en los extremos. |
| `bio` | De 0 a 200 caracteres. |
| `title` | De 0 a 100 caracteres. |
| `chatMessage` | De 1 a 300 caracteres después de quitar los espacios. |
| `avatarFile` | `image/jpeg`, `image/png` o `image/webp`, de hasta 2 MB. |

---

## 9. Dirección visual

### 9.1 Escena y principios

**Escena:** de noche, en una habitación con poca luz. El espectador mira en la laptop o en el celular; el streamer tiene OBS en una pantalla y el estudio en otra. El modo oscuro no es un gusto: es donde se usa.

**Principios**
1. **El video manda.** La interfaz es un marco quieto alrededor del stream y del chat.
2. **El estado se ve de lejos.** Desconectado, esperando señal y en vivo tienen formas distintas, no solo colores distintos.
3. **El logo es el sistema.** Los cuatro nodos circulares dan la geometría: círculos para avatares y estados, cápsulas para acciones, paneles de esquinas suaves para el contenido.
4. **Color con trabajo.** Cada color tiene una función fija. Ninguno decora.

### 9.2 Qué se toma de Stitch y qué cambia

| Se toma | Cambia | Por qué |
|---|---|---|
| Fondo índigo casi negro, cian como color de acción y azul real como acento | Los tonos se sacan del logo y no de Stitch, y el azul real pasa a significar "en vivo" en toda la app | El color cuenta el estado, no decora. |
| Video con el chat a la derecha (360 px) | Sin barra lateral de canales ni secciones que no existen | Requerimientos §2. |
| Paneles con borde de 1 px | Sin vidrio esmerilado, sin brillos cian y sin degradados de fondo. El único fondo translúcido es el de los controles del video | El brillo neón es la estética por defecto de "app oscura". Aquí el contraste lo dan los tonos de superficie. |
| Etiquetas sobre los campos | En minúscula normal (no MAYÚSCULAS espaciadas) | Se leen más rápido y la interfaz suena menos a plantilla. |
| Plus Jakarta Sans | Bricolage Grotesque para títulos y Figtree para el texto (D2) | Ver 9.4. |
| Insignia "EN VIVO" con un punto | Insignia "En vivo" con el nodo de anillos del logo | Ver 9.6. |
| Nombres del chat en blanco | Un color por usuario, de 5 tonos accesibles (D3) | En un chat rápido el color ayuda a seguir quién habla. |

### 9.3 Color

Estrategia: una base índigo teñida del logo, más dos colores de marca con función fija y un color de error.

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `noche` | `#12101f` | Fondo de la app | — |
| `panel` | `#1a1830` | Chat, tarjetas, formularios y modales | — |
| `relieve` | `#24213f` | Campos, hover, menú y fila enfocada | — |
| `linea` | `#312d52` | Bordes de 1 px y divisores | 3:1 no aplica (decorativo) |
| `texto` | `#efedf9` | Texto principal | 15,9:1 sobre `panel` |
| `texto-suave` | `#a7a4c4` | Texto secundario, ayudas y horas | 6,9:1 sobre `panel` |
| `texto-tenue` | `#8e8bb2` | Placeholders y contadores | 4,7:1 sobre `relieve` |
| `senal` | `#12c4e3` | Botón principal, foco, enlaces, anillos de los estados y selección | 8,1:1 sobre `panel` |
| `senal-fuerte` | `#4fd6ee` | Hover del botón principal | — |
| `al-aire` | `#2410d0` | En vivo: insignia, insignia "Streamer" y el campo del estudio al aire | Blanco encima 10,2:1, `senal` encima 4,9:1 |
| `teal` | `#0098b3` | Solo la palabra "strim" del logo | 5,1:1 sobre `noche` |
| `error` | `#ff7a8a` | Texto de error y borde del campo con error | 6,0:1 sobre `panel` |
| `peligro` | `#d1343b` | Fondo del botón destructivo (texto blanco) | Blanco encima 4,9:1 |

**Colores de nombres del chat** (D3), elegidos por un hash del username, todos con más de 4,5:1 sobre `panel`: `#4fd6ee` cian claro, `#a9a6ff` lavanda, `#6fe3c1` menta, `#ff9ec0` rosa y `#ffc46b` ámbar.

No hay modo claro (requerimientos RNF-07).

### 9.4 Tipografía

| Rol | Fuente | Por qué |
|---|---|---|
| Títulos, nombres de canal, título del stream y la palabra "strim" | **Bricolage Grotesque** variable, 700–800 | Grotesca pesada con cortes en las uniones, como las letras del logo. Da carácter sin caer en la fuente de siempre. |
| Texto, formularios, chat y botones | **Figtree** variable, 400–700 | Geométrica y redonda como el lema "LIVE SENCILLO", muy legible en tamaños chicos. |
| Servidor y clave de OBS | Monoespaciada del sistema (`ui-monospace`, Cascadia Mono, Consolas) | Distingue `l`, `1`, `I`, `0` y `O` en datos que se copian. Solo se usa ahí. |

**Escala** (base 16 px, razón 1,25):

| Token | Tamaño / interlineado | Fuente | Uso |
|---|---|---|---|
| `xs` | 12 / 16 | Figtree 500 | Hora del chat, contadores |
| `sm` | 14 / 20 | Figtree 400–600 | Metadatos, ayudas, etiquetas |
| `chat` | 15 / 22 | Figtree 400 (nombre 700) | Mensajes |
| `base` | 16 / 24 | Figtree 400 | Texto y campos |
| `lg` | 20 / 28 | Bricolage 700 | Títulos de panel, nombre del canal |
| `xl` | 25 / 32 | Bricolage 700 | Título del stream |
| `2xl` | 31 / 38 | Bricolage 800 | Títulos de página |
| `3xl` | 39 / 44 | Bricolage 800 | Estado del estudio, estado vacío del inicio |

- Bricolage lleva `letter-spacing: -0.02em`. Figtree va sin ajuste.
- Números que cambian (tiempo en vivo, espectadores, cuenta regresiva) con `font-variant-numeric: tabular-nums`, para que no bailen.
- Las líneas de texto no pasan de 70 caracteres (bio, ayudas y avisos).

### 9.5 Forma, espacio y elevación

- **Radios por jerarquía:**
  - Círculo: avatares y nodos de estado.
  - Cápsula (`999px`): botones, insignias y el botón "Mensajes nuevos".
  - `12px`: campos de texto.
  - `20px`: paneles (marco del video, chat, tarjetas y modales).
- **Espaciado:** múltiplos de 4 px: 4, 8, 12, 16, 24, 32, 48 y 64. Más espacio arriba de un título que abajo.
- **Elevación:** por tono, no por sombra: `noche` → `panel` → `relieve`. Los modales usan `panel` con borde `linea` sobre un velo `rgba(10, 9, 20, 0.72)`, sin desenfoque.
- **Única transparencia:** la barra de controles del video, `rgba(18, 16, 31, 0.82)`, porque va encima de la imagen.
- **Foco:** `outline: 2px solid senal` con 2 px de separación en `:focus-visible`, en todo lo que se enfoca.
- **Tamaños táctiles:** botones e íconos de 44 px de alto. En escritorio, "Copiar" y los controles densos pueden medir 36 px.

### 9.6 Movimiento característico: el nodo de estado

El cuarto nodo del logo (el de anillos concéntricos) es la señal saliendo. Ese nodo dibuja el estado del canal en toda la app:

```
  Desconectado            Esperando señal              En vivo
      ◯                     ◌ ◌ ◎ ◌ ◌                     ◉ ))
  anillo hueco           los anillos se cierran        nodo lleno con anillos
  en texto-suave         hacia el centro, en bucle     en senal, sobre al-aire
```

- **Estudio:** el nodo mide 72 px y es lo primero que se ve. Cuando el canal pasa a `live`, todo el panel de estado cambia a fondo `al-aire`: el streamer sabe que está al aire con una mirada, desde la otra pantalla.
- **Insignia "En vivo"** (tarjetas, canal y barra): cápsula `al-aire` con el nodo de 12 px y el texto "En vivo" en blanco.
- **Avatares en vivo:** el avatar lleva un anillo `senal` de 2 px con separación, como el nodo del logo. Sin pulsos.
- **Esperando señal:** los anillos se contraen hacia el centro en 2,4 s. Es la única animación en bucle de la app.
- **Al pasar a en vivo** en el canal: el estado "Desconectado" se funde con el video en 200 ms.
- Con `prefers-reduced-motion: reduce`, los anillos quedan quietos y los cambios de estado son inmediatos.

**Resto del movimiento:** cambios de color de 150 ms en hover y foco; modales que aparecen con opacidad y escala de 0,98 a 1 en 160 ms y se van en 120 ms; el botón "Mensajes nuevos" sube 8 px al aparecer. Los mensajes del chat entran sin animación.

### 9.7 Logo

- **Símbolo:** se redibuja en SVG con cuatro círculos en cuadrícula de 2 × 2: cian, azul real, cian y el nodo de anillos (D1). Se usa en la barra (28 px), en las páginas de cuenta (40 px), en el favicon y, en contorno, en el estado vacío del inicio.
- **Palabra:** "strim" escrita con Bricolage Grotesque 800 en `teal`, junto al símbolo.
- El conjunto es un enlace a `/` con el nombre accesible "strim, inicio".

### 9.8 Componentes base (`components/`)

| Componente | Variantes y notas |
|---|---|
| `Button` | `primary` (fondo `senal`, texto `noche`), `secondary` (fondo `relieve`, borde `linea`), `ghost` y `danger` (fondo `peligro`). Tamaños `md` (44 px) y `sm` (36 px). Con `loading` muestra un spinner, conserva el texto, queda deshabilitado y lleva `aria-busy` (RF-16.3). |
| `IconButton` | Botón de 44 × 44 con `aria-label` obligatorio en el tipo. |
| `Field` | Etiqueta visible arriba, campo, ayuda y error debajo, enlazados con `aria-describedby`. El error lleva ícono y texto, no solo color. |
| `PasswordField` | `Field` con botón "Mostrar contraseña" / "Ocultar contraseña" (`aria-pressed`). Con `rules` muestra la lista de reglas que se marcan mientras se escribe (RF-03.2). |
| `OtpInput` | Un solo `<input>` con `inputmode="numeric"`, `autocomplete="one-time-code"` y `maxlength` igual a `OTP_LENGTH`, dibujado como una casilla por dígito. Así funcionan pegar, el autocompletado del sistema y los lectores de pantalla (RF-04.1). |
| `CopyField` | Valor en monoespaciada, solo lectura, con botón "Copiar" que cambia a "Copiado" 2 s y lo anuncia con `aria-live`. Con `secret`, se ve como `••••` y suma "Mostrar" (RF-12.6). |
| `Modal` | `<dialog>` con título, descripción, contenido y acciones. Cierra con Escape y con "Cancelar". |
| `Avatar` | Imagen redonda o iniciales sobre un tono del hash del username. Tamaños 24, 32, 40, 64, 96 y 120. Prop `live` para el anillo. |
| `StatusNode` | El nodo de 9.6 en tres estados y tres tamaños (12, 24 y 72 px). Decorativo (`aria-hidden`): el estado siempre va también en texto. |
| `LiveBadge` | Cápsula "En vivo" (9.6). |
| `Stat` | Ícono + número + nombre accesible, por ejemplo `<Eye/> 124` con la etiqueta "124 espectadores". Reemplaza a las cadenas con puntos medios. |
| `Toaster` | Avisos abajo a la derecha (abajo al centro en móvil), `role="status"`, se van a los 4 s y no toman el foco (RF-16.4). |
| `Spinner`, `Skeleton` | Carga. `Skeleton` reserva el tamaño final para que nada salte (RF-07.4). |
| `EmptyState` | Símbolo en contorno, título, texto y una acción. |

---

## 10. Pantallas

Los anchos de referencia son 1440 px (escritorio) y 390 px (móvil). El cambio de una a dos columnas en el canal ocurre en 1024 px.

### 10.1 Barra superior (RF-01)

```
Escritorio, sin sesión
┌──────────────────────────────────────────────────────────────────────────────┐
│ [●●] strim                                    (◉ Transmitir)  Iniciar sesión  (Crear cuenta) │
└──────────────────────────────────────────────────────────────────────────────┘
Escritorio, con sesión y en vivo
│ [●●] strim                                    (◉ En vivo · Estudio)   (AV)▾  │
                                                                      ┌──────────────┐
                                                                      │ Ana Torres   │
                                                                      │ @ana         │
                                                                      │ Mi canal     │
                                                                      │ Estudio      │
                                                                      │ Ajustes      │
                                                                      │ Cerrar sesión│
                                                                      └──────────────┘
Móvil
│ [●●] strim                                      [◉]   (AV)  o  (Entrar)      │
```

- Alto de 56 px, fondo `noche` y borde inferior `linea`. Queda fija arriba.
- "Transmitir" es un botón `secondary` con el nodo de 12 px. Si el canal está en vivo, el botón toma el fondo `al-aire` y dice "En vivo" (RF-01.4).
- En móvil, "Transmitir" queda como ícono con nombre accesible, y "Iniciar sesión" y "Crear cuenta" se juntan en "Entrar", que lleva a `/login`.

### 10.2 Inicio (RF-07)

```
┌ barra ───────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  En vivo ahora                                                               │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │                      │  │                      │  │                      │ │
│  │        (◉AV)         │  │        (◉AV)         │  │        (◉AV)         │ │
│  │  (En vivo)  👁 124   │  │                      │  │                      │ │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘ │
│  Ana Torres                 …                         …                      │
│  Probando el nuevo setup de OBS con cámara y                                 │
│  ⏱ 1:02:33                                                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Cuadrícula de 1, 2, 3 o 4 columnas según el ancho (mínimo 280 px por tarjeta), con 24 px entre tarjetas. Contenido alineado a la izquierda y ancho máximo de 1280 px.
- **Tarjeta (D3 de los requerimientos):** un marco 16:9 en `panel` con el avatar de 96 px centrado y su anillo de en vivo, la insignia "En vivo" y los espectadores abajo a la izquierda. Debajo del marco: nombre visible (Figtree 700), título en 2 líneas como máximo y tiempo en vivo. Toda la tarjeta es un solo enlace. En hover y foco, el borde del marco pasa a `senal`.
- El fondo de cada marco varía apenas, con el mismo tono del hash del avatar al 8 %, para que las tarjetas no sean idénticas sin inventar miniaturas.
- **Carga:** 4 tarjetas `Skeleton` del mismo tamaño.
- **Error:** `EmptyState` con "No pudimos cargar los canales." y el botón "Reintentar".

```
Estado vacío (el caso más común al empezar)
│                                                                              │
│                ○ ○                                                           │
│                ○ ◎       Nadie está en vivo ahora                            │
│                          Cuando alguien empiece a transmitir, aparece aquí.  │
│                          (Transmite tú)                                      │
```

- El símbolo del logo en contorno, a 120 px, a la izquierda del texto (arriba en móvil). "Transmite tú" lleva a `/dashboard` (RF-07.3).

### 10.3 Canal (RF-08 a RF-11)

```
Escritorio (≥ 1024 px)
┌ barra ──────────────────────────────────────────────────────┬────────────────────┐
│ ┌────────────────────────────────────────────────────────┐ │ Chat               │
│ │                                                        │ │────────────────────│
│ │                     video 16:9                         │ │ ana  hola a todos  │
│ │ (🔇 Activar sonido)                                    │ │ leo  qué buena     │
│ │                                                        │ │      calidad       │
│ │ [▶] [🔊 ━━━━○──]                              [⛶]      │ │ (Streamer) Ana     │
│ └────────────────────────────────────────────────────────┘ │   gracias!         │
│                                                            │                    │
│ (◉AV) Ana Torres  @ana                    (Ir al estudio)  │ (↓ Mensajes nuevos)│
│ Probando el nuevo setup de OBS con cámara                  │────────────────────│
│ (En vivo)  👁 124  ⏱ 1:02:33                               │ [Escribe un mensaje]│
│ Bio: Streams de desarrollo web los martes y jueves.        │ 300            [➤] │
└────────────────────────────────────────────────────────────┴────────────────────┘
```

- **Columnas:** la de la izquierda es fluida y se desplaza. El chat mide 360 px, ocupa todo el alto bajo la barra (`100dvh − 56 px`), con fondo `panel` y borde izquierdo `linea`.
- **Datos del canal:** avatar de 64 px, nombre (Bricolage `lg`), `@username` en `texto-suave` y el título (Bricolage `xl`). Debajo, `LiveBadge` y los `Stat` de espectadores y tiempo en vivo. La bio va al final, en `texto-suave`. "Ir al estudio" solo lo ve el dueño (RF-08.8).

```
Desconectado (mismo marco 16:9)
│ ┌────────────────────────────────────────────────────────┐ │
│ │                         ◯ (AV 96)                      │ │
│ │               Ana Torres no está en vivo               │ │
│ │                  El chat sigue abierto.                │ │
│ └────────────────────────────────────────────────────────┘ │
```

- Conectando (RF-09.5): el mismo marco con el nodo "esperando señal" y el texto "Conectando…".
- Canal borrado (RF-08.6): el marco dice "Este canal ya no existe" y el chat se reemplaza por ese mismo aviso.

```
Móvil (< 1024 px)
┌ barra ─────────────────────────┐
│ video 16:9 (fijo arriba)       │
├────────────────────────────────┤
│ (◉AV) Ana Torres (En vivo) 👁124│
│ Probando el nuevo setup…  [▾]  │  ← "▾" abre título completo, tiempo y bio
├────────────────────────────────┤
│ Chat (ocupa el resto)          │
│ ...                            │
│ [Escribe un mensaje]       [➤] │
└────────────────────────────────┘
```

**Chat**
- Encabezado: "Chat" y, si la conexión se cae, "Reconectando…" en `texto-suave` con un spinner (RF-10.7).
- **Mensaje:** el nombre visible en su color (D3) y en negrita, seguido del texto en `texto` en la misma línea, con sangría francesa al envolver. La insignia "Streamer" (cápsula `al-aire`, `xs`) va antes del nombre del dueño (RF-10.4). La hora (`HH:mm`, `texto-suave`, `xs`) aparece a la derecha al pasar el mouse o al enfocar el mensaje, y siempre está en un `<time>` para lectores de pantalla (RF-10.3).
- Se dibuja como texto de React, nunca con `dangerouslySetInnerHTML` (RF-10.5).
- **Campo con sesión** (RF-11.2): `relieve`, radio de 12 px y foco con borde `senal`. Enter envía y el botón de enviar es un `IconButton` "Enviar mensaje". Desde los 260 caracteres muestra cuántos quedan. "Vas muy rápido" aparece debajo en `error` durante 3 s (RF-11.5).
- **Sin sesión** (RF-11.1): en lugar del campo, el botón `secondary` "Inicia sesión para comentar", a todo el ancho.
- Chat vacío: "Todavía no hay mensajes. Escribe el primero." (sin sesión: "Todavía no hay mensajes.").

### 10.4 Estudio (RF-12)

```
Escritorio
┌ barra ───────────────────────────────────────────────────────────────────────┐
│ Estudio                                                    (Ver mi canal ↗)   │
│                                                                               │
│ ┌ panel de estado ─────────────────────────────┐ ┌ Conectar OBS ────────────┐ │
│ │                                              │ │ Servidor                 │ │
│ │   ◯   Desconectado                           │ │ [rtmp://localhost:1935/…]│ │
│ │       Pega los datos en OBS y pulsa          │ │                  (Copiar)│ │
│ │       Iniciar stream.                        │ │ Clave de transmisión     │ │
│ │                                              │ │ [••••••••••••] (Mostrar) │ │
│ │   Título del stream                          │ │                  (Copiar)│ │
│ │   [Probando el nuevo setup de OBS…]          │ │ No compartas tu clave:   │ │
│ │   87 / 100                 (Guardar título)  │ │ con ella cualquiera      │ │
│ │                                              │ │ transmite en tu canal.   │ │
│ │   (Iniciar stream)                           │ │ (Regenerar clave)        │ │
│ └──────────────────────────────────────────────┘ ├──────────────────────────┤ │
│                                                  │ Cómo conectar OBS        │ │
│                                                  │ 1. En OBS: Ajustes →     │ │
│                                                  │    Emisión → Servicio    │ │
│                                                  │    "Personalizado".      │ │
│                                                  │ 2. Pega el servidor y la │ │
│                                                  │    clave. En Salida, usa │ │
│                                                  │    fotogramas clave de 2 s.│
│                                                  │ 3. Aquí, pulsa Iniciar   │ │
│                                                  │    stream.               │ │
│                                                  │ 4. En OBS, pulsa Iniciar │ │
│                                                  │    transmisión.          │ │
│                                                  └──────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────┘
```

- Dos columnas (7/5) desde 1024 px; una sola en móvil, en el orden: estado, Conectar OBS y la guía. Ancho máximo de 1280 px.
- La guía usa una lista numerada porque son pasos en orden (RF-12.7).

**Los tres estados del panel**

| Estado | Nodo (72 px) | Título (`3xl`) | Texto | Acción principal | Fondo |
|---|---|---|---|---|---|
| `offline` | Anillo hueco | Desconectado | Pega los datos en OBS y pulsa Iniciar stream. | `primary` "Iniciar stream" | `panel` |
| `waiting` | Anillos que se cierran | Esperando la señal de OBS | En OBS, pulsa Iniciar transmisión. Tarda unos segundos en aparecer. | `secondary` "Finalizar stream" | `panel` |
| `live` | Nodo lleno con anillos | En vivo · `1:02:33` | Tu stream se está viendo en strim. | `secondary` "Finalizar stream" (con confirmación) | `al-aire` |

- En `live`, debajo de la acción aparece la vista previa 16:9 en silencio (RF-12.10).
- **Finalizar estando en vivo** (RF-12.5): `Modal` "¿Finalizar el stream?" con "Tu canal dejará de estar en vivo y OBS se desconectará." y las acciones "Seguir en vivo" y `danger` "Finalizar stream".
- **Regenerar clave** (RF-12.8): `Modal` "¿Regenerar la clave?" con "La clave actual dejará de funcionar. Tendrás que pegar la nueva en OBS." y las acciones "Cancelar" y "Regenerar clave". Fuera de `offline`, el botón queda deshabilitado con la ayuda "Finaliza el stream para regenerar la clave." (RF-12.9).

### 10.5 Ajustes (RF-13 a RF-15)

```
┌ barra ─────────────────────────────────────────────┐
│ Ajustes                                            │
│ ┌ Perfil ────────────────────────────────────────┐ │
│ │ (AV 120)  (Cambiar foto)                        │ │
│ │           JPG, PNG o WebP de hasta 2 MB.        │ │
│ │ Nombre visible  [Ana Torres            ]        │ │
│ │ Nombre de usuario [ana                 ]        │ │
│ │                 Tu canal: strim/ana             │ │
│ │ Bio             [Streams de desarrollo…]        │ │
│ │                                     54 / 200    │ │
│ │ Correo          ana@correo.com (no se puede cambiar)│
│ │                                (Guardar cambios)│ │
│ └─────────────────────────────────────────────────┘ │
│ ┌ Contraseña ────────────────────────────────────┐ │
│ │ Cámbiala cuando quieras.    (Cambiar contraseña)│ │
│ └─────────────────────────────────────────────────┘ │
│ ┌ Borrar cuenta ─────────────────────── borde error┐│
│ │ Se borran tu perfil, tu canal y tus mensajes.   │ │
│ │ No se puede deshacer.             (Borrar cuenta)│ │
│ └─────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

- Una columna de 640 px como máximo, alineada a la izquierda.
- "Cambiar foto" abre el selector de archivos y sube al elegir (RF-13.2). Mientras sube, el avatar muestra un spinner.
- Con el canal fuera de `offline`, el username queda deshabilitado con la ayuda "Finaliza el stream para cambiar tu username." (RF-13.5).
- **Modal "Cambiar contraseña"** (RF-14): "Contraseña actual" y "Contraseña nueva" (con reglas), acciones "Cancelar" y "Cambiar contraseña".
- **Modal "Borrar cuenta"** (RF-15): el texto de consecuencias, el campo "Contraseña" y las acciones "Cancelar" y `danger` "Borrar mi cuenta".

### 10.6 Páginas de cuenta (RF-03 a RF-06)

```
┌──────────────────────────────────────┐
│              [●●] strim              │
│                                      │
│   ( Iniciar sesión | Crear cuenta )  │  ← dos enlaces con forma de pestañas
│                                      │
│   Inicia sesión                      │
│   Correo                             │
│   [ana@correo.com              ]     │
│   Contraseña      ¿La olvidaste?     │
│   [••••••••                 👁]      │
│   (Iniciar sesión)                   │
└──────────────────────────────────────┘
```

- Columna de 400 px centrada en la pantalla, sobre `noche`, con el formulario en un `panel` de radio 20 px.
- Las "pestañas" son dos enlaces (`/login` y `/register`) con `aria-current="page"` en el activo. Solo aparecen en esas dos páginas.
- **Crear cuenta:** correo, nombre de usuario (ayuda "Será tu canal: strim/<nombre de usuario>") y contraseña con reglas. Botón "Crear cuenta".
- **Verificar:** título "Revisa tu correo", texto "Enviamos un código de 8 dígitos a **ana@correo.com**." (el número sale de `VITE_OTP_LENGTH`), `OtpInput`, "Reenviar código" (con "Reenviar en 0:42" mientras espera) y el enlace "Usar otro correo", que vuelve a `/register`.
- **Recuperar:** paso 1 "Recupera tu contraseña" con el correo y "Enviar código". Paso 2 con el aviso del envío, `OtpInput`, "Contraseña nueva" y "Cambiar contraseña". El paso vive en el estado de la página.
- `autocomplete`: `email`, `username`, `current-password` y `new-password` donde corresponde, para que funcionen los gestores de contraseñas.

### 10.7 Página no encontrada

`EmptyState` con el símbolo en contorno, "Esta página no existe" (o "Este canal no existe" en `/:username`) y el botón "Ir al inicio" (RF-16.5).

---

## 11. Textos clave

| Lugar | Texto |
|---|---|
| Sin conexión con el backend | No pudimos conectar con el servidor. **Reintentar** |
| Aviso tras guardar el perfil | Cambios guardados |
| Aviso tras cambiar la contraseña | Contraseña actualizada |
| Aviso tras borrar la cuenta | Tu cuenta se borró |
| Aviso tras regenerar la clave | Clave regenerada. Pégala en OBS. |
| Login tras restablecer | Contraseña actualizada. Inicia sesión. |
| Recuperar, paso 1 enviado | Si existe una cuenta con ese correo, te enviamos un código. |
| Login con correo sin verificar | Tu correo aún no está verificado. Te enviamos un código nuevo. |
| Avatar inválido (antes de enviar) | Elige una imagen JPG, PNG o WebP de hasta 2 MB. |
| Reglas de contraseña | Entre 8 y 72 caracteres · Al menos una letra · Al menos un número |

Los demás errores usan el `message` del backend (sección 9 del diseño del backend). Las acciones mantienen su nombre en todo el recorrido: "Iniciar stream" → "Finalizar stream"; "Regenerar clave" → "Clave regenerada".

## 12. Accesibilidad (RNF-05)

- Enlace "Saltar al contenido" como primer elemento enfocable, visible al recibir foco.
- Un `<h1>` por página y los títulos de panel en `<h2>`.
- El estado nunca depende solo del color: el nodo tiene tres formas y siempre va con texto.
- `LiveBadge` dice "En vivo" en texto real. Los `Stat` tienen etiqueta completa ("124 espectadores", "En vivo desde hace 1 hora y 2 minutos").
- Los avisos usan `role="status"`. Los errores de formulario usan `aria-invalid` y `aria-describedby`, y al enviar con errores el foco va al primer campo inválido.
- El chat usa `role="log"`. El botón "Mensajes nuevos" no roba el foco.
- Los modales tienen `aria-labelledby` y `aria-describedby`. El foco inicial va al primer campo o, en las confirmaciones, al botón de cancelar.
- Contraste revisado en la tabla de 9.3.
- `prefers-reduced-motion: reduce` desactiva el bucle del nodo, las transiciones de los modales y el fundido del video.

## 13. Configuración, scripts y dependencias

**Variables de entorno** (`.env.example` se versiona, `.env` se ignora):

| Variable | Ejemplo | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | REST (`/api`) y Socket.IO. |
| `VITE_OTP_LENGTH` | `8` | Dígitos del código de Supabase ("Email OTP Length", de 6 a 10). El backend acepta cualquiera de esos largos. |

La URL del video viene en `playbackUrl` desde el backend, así que el frontend no necesita la de MediaMTX.

**Scripts**

| Script | Comando |
|---|---|
| `dev` | `vite` (puerto 5173, `strictPort: true`) |
| `build` | `tsc -b && vite build` |
| `preview` | `vite preview` |
| `typecheck` | `tsc -b` |
| `lint` | `eslint .` |

- **Dependencias:** `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `socket.io-client`, `hls.js`, `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`, `@fontsource-variable/bricolage-grotesque` y `@fontsource-variable/figtree`.
- **Desarrollo:** `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `@tailwindcss/vite`, `@types/react`, `@types/react-dom`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks` y `eslint-plugin-react-refresh`.
- `strictPort` evita que Vite cambie de puerto en silencio: el CORS del backend solo acepta el 5173.

## 14. Riesgos y limitaciones conocidas

| Tema | Detalle |
|---|---|
| Token en `localStorage` | Un XSS podría leerlo. Se reduce mostrando todo como texto y sin HTML de terceros (requerimientos D2). |
| Retraso del video | El LL-HLS de MediaMTX suma unos segundos, y el paso a en vivo tarda hasta 3 s más. Por eso existe el estado "Conectando…". |
| Autoplay | Los navegadores pueden bloquear incluso el autoplay en silencio (por ejemplo, con ahorro de batería). Entonces se ve el botón de play. |
| Tipos copiados | `lib/types.ts` se copia del backend: si cambia el contrato, hay que actualizarlo a mano. |
| Logo aproximado | Mientras no haya SVG, la palabra "strim" se escribe con la fuente y se parece al logo sin ser idéntica (D1). |
| Espectadores | Cuenta conexiones: dos pestañas abiertas son dos espectadores (limitación del backend). |

## 15. Cobertura de los requerimientos

| Requerimiento | Dónde |
|---|---|
| RF-01 Navegación | 4, 10.1 |
| RF-02 Sesión | 4, 5.1, 5.2, 6.1 |
| RF-03 a RF-06 Cuentas | 5.4, 9.8 (`PasswordField`, `OtpInput`), 10.6 |
| RF-07 Inicio | 5.3, 10.2 |
| RF-08 Canal | 5.3, 6.2, 10.3 |
| RF-09 Reproductor | 7, 10.3 |
| RF-10 y RF-11 Chat | 6.2, 6.3, 10.3 |
| RF-12 Estudio | 7 (vista previa), 9.6, 10.4 |
| RF-13 a RF-15 Ajustes | 5.4, 10.5 |
| RF-16 Errores y avisos | 5.2, 5.4, 9.8 (`Toaster`), 11 |
| RNF-01 Stack | 2, 13 |
| RNF-02 Integración | 1, 5.2, 13 |
| RNF-03 Seguridad | 4 (`safeNext`), 6.2, 9.8 (`CopyField`) |
| RNF-04 Responsive | 9.5, 10 |
| RNF-05 Accesibilidad | 9.3, 9.5, 12 |
| RNF-06 Textos | 11 |
| RNF-07 Identidad | 9 |
| RNF-08 Rendimiento | 2 (fuentes, hls.js diferido), 4 (páginas diferidas), 7 |
| RNF-09 Navegadores | 7 (hls.js y HLS nativo) |

## 16. Decisiones para confirmar

| # | Pregunta | Propuesta | Alternativa |
|---|---|---|---|
| D1 | ¿Cómo se dibuja el logo? | El símbolo redibujado en SVG (son cuatro círculos) y la palabra "strim" escrita con Bricolage Grotesque. | Me pasas el logo en SVG y se usa tal cual. |
| D2 | ¿Qué tipografías? | Bricolage Grotesque para títulos y Figtree para el texto, distintas a Stitch y cercanas al logo. | Plus Jakarta Sans en todo, como en Stitch. |
| D3 | ¿Colores en los nombres del chat? | Sí, 5 tonos accesibles asignados por username. | Todos los nombres del mismo color, como en Stitch. |
| D4 | ¿Cómo se escriben los estilos? | Tailwind CSS 4 con los tokens de la sección 9 en `@theme`. | CSS Modules con variables CSS, sin Tailwind. |
