# Strim · Frontend

Frontend web de **Strim** ("live sencillo"), una app de streaming minimalista: un usuario transmite desde OBS, los espectadores ven el video en el navegador y comentan en un chat en vivo. Solo los usuarios con sesión iniciada pueden comentar.

Es una SPA en React que consume la API REST y el Socket.IO del [backend](../backend/README.md), y reproduce el video HLS que sirve MediaMTX.

La especificación con la que se construyó está en [`specs/`](specs/): [requerimientos](specs/requirements.md), [diseño](specs/design.md) y [tareas](specs/tasks.md). El sistema visual está documentado en [`DESIGN.md`](DESIGN.md) y el contexto de producto en [`PRODUCT.md`](PRODUCT.md).

## Contenido

1. [Qué hace](#1-qué-hace)
2. [Stack](#2-stack)
3. [Requisitos](#3-requisitos)
4. [Instalación y puesta en marcha](#4-instalación-y-puesta-en-marcha)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Scripts](#6-scripts)
7. [Rutas](#7-rutas)
8. [Estructura del código](#8-estructura-del-código)
9. [Cómo transmitir con OBS](#9-cómo-transmitir-con-obs)
10. [Prueba de punta a punta](#10-prueba-de-punta-a-punta)
11. [Problemas comunes](#11-problemas-comunes)

---

## 1. Qué hace

- **Inicio:** los canales que están en vivo, con su avatar, título, espectadores y tiempo en vivo. Se actualiza solo cada 30 s.
- **Canal** (`/<username>`): el video en vivo, los datos del canal y el chat en tiempo real. Cualquiera mira y lee; para escribir hay que iniciar sesión.
- **Cuentas:** crear cuenta, verificar el correo con el código que llega, iniciar y cerrar sesión, y recuperar la contraseña con un código.
- **Estudio** (`/dashboard`): el estado del stream, el título, "Iniciar stream" y "Finalizar stream", el servidor y la clave para OBS, regenerar la clave y una vista previa en silencio.
- **Ajustes** (`/settings`): nombre visible, nombre de usuario, bio y foto; cambiar la contraseña; borrar la cuenta.

Solo modo oscuro y solo español. Funciona desde 360 px de ancho hasta escritorio, y cumple WCAG 2.1 AA (revisado con axe).

## 2. Stack

| Tema | Herramienta |
|---|---|
| Base | React 19, TypeScript (modo estricto), Vite 7 |
| Paquetes | pnpm |
| Rutas | React Router 7 |
| Datos del servidor | TanStack Query 5 |
| Formularios | react-hook-form + zod 4 (las mismas reglas que el backend) |
| Tiempo real | socket.io-client 4 |
| Video | hls.js (o el HLS nativo en Safari/iOS), cargado solo donde hay video |
| Estilos | Tailwind CSS 4, con los tokens del diseño en `src/styles.css` |
| Fuentes | Bricolage Grotesque y Figtree, servidas por la app (`@fontsource-variable`) |
| Íconos | lucide-react |

## 3. Requisitos

- **Node.js 22** y **pnpm** (10 o superior).
- El **backend** corriendo (API en `http://localhost:4000`) y **MediaMTX** en Docker (video en `http://localhost:8888`). Ver [`backend/README.md`](../backend/README.md).
- El backend acepta el frontend solo desde `http://localhost:5173`: en su `.env` debe estar `FRONTEND_URL=http://localhost:5173`.
- **OBS Studio** para transmitir.

## 4. Instalación y puesta en marcha

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm dev
```

Abre <http://localhost:5173>.

pnpm 11 pide aprobar los scripts de instalación: `pnpm-workspace.yaml` ya aprueba el de `esbuild`, que usa Vite.

## 5. Variables de entorno

Se configuran en `.env` (no se sube a git). `.env.example` tiene los valores de desarrollo.

| Variable | Ejemplo | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | Backend: REST en `/api` y Socket.IO en el mismo host. |
| `VITE_OTP_LENGTH` | `8` | Dígitos del código que manda Supabase (Authentication → Email → "Email OTP Length", de 6 a 10). Debe coincidir con Supabase. |

Vite lee el `.env` al arrancar: si lo cambias, reinicia `pnpm dev`.

La URL del video no se configura aquí: llega en `playbackUrl` desde el backend.

## 6. Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo en el puerto 5173 (falla si está ocupado, en vez de cambiarlo). |
| `pnpm build` | Revisa los tipos y genera la versión de producción en `dist/`. |
| `pnpm preview` | Sirve `dist/` en el puerto 5173 para probar el build. |
| `pnpm typecheck` | Revisa los tipos de TypeScript. |
| `pnpm lint` | ESLint. |

## 7. Rutas

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/` | Canales en vivo | Público |
| `/login`, `/register`, `/verify`, `/reset` | Cuentas | Solo sin sesión |
| `/dashboard` | Estudio | Con sesión |
| `/settings` | Ajustes | Con sesión |
| `/<username>` | Canal | Público |
| `/dev/ui` | Catálogo de componentes | Solo en `pnpm dev` (no entra en el build) |

Las rutas fijas usan palabras que el backend ya reserva como username, así ningún canal choca con ellas.

## 8. Estructura del código

```
src/
├── main.tsx            arranque: sesión, socket y router
├── router.tsx          rutas, layouts y guardas
├── styles.css          Tailwind, fuentes y tokens del diseño
├── lib/                api (fetch + errores), sesión, socket, consultas, tipos, validación y formatos
├── components/         piezas de UI sin lógica de negocio (Button, Field, Modal, Avatar, StatusNode…)
├── layout/             barra superior, menú del usuario, layouts y guardas de sesión
├── features/           canal, chat, reproductor, estudio y ajustes
└── pages/              una página por ruta
```

- **Sesión** (`lib/session.ts`): tokens en `localStorage`, compartidos entre pestañas. El token se renueva solo antes de vencer y, si una petición responde 401, se renueva una vez y se repite.
- **Socket** (`lib/socket.ts`): una sola conexión para toda la app. Se reconecta al iniciar o cerrar sesión, y el estado de tu stream llega a la barra y al estudio sin recargar.
- **Errores:** se muestran los mensajes en español que manda el backend, junto al campo que corresponde.

## 9. Cómo transmitir con OBS

1. Inicia sesión y entra a **Transmitir** (`/dashboard`).
2. En OBS: Ajustes → Emisión → Servicio **Personalizado**. Pega el **Servidor** y la **Clave de transmisión** del estudio.
3. Recomendado: Ajustes → Salida → intervalo de fotogramas clave de **2 s** (menos retraso).
4. En el estudio, pulsa **Iniciar stream**. Debe decir "Esperando la señal de OBS".
5. En OBS, pulsa **Iniciar transmisión**. En unos segundos el estudio pasa a "En vivo".

El backend solo acepta la señal de OBS después del paso 4. Si OBS dice que no pudo acceder al canal o a la clave, casi siempre es que faltó pulsar "Iniciar stream".

## 10. Prueba de punta a punta

Con el backend, MediaMTX y `pnpm dev` corriendo, en escritorio y en el celular:

1. Crear una cuenta y verificar el correo con el código.
2. Editar el perfil y subir una foto.
3. Copiar los datos a OBS, iniciar el stream y verlo en la vista previa del estudio.
4. El canal aparece en el inicio.
5. En otro navegador, sin sesión: ver el stream y leer el chat, sin poder escribir.
6. Ese navegador inicia sesión y comenta; el streamer lo ve en su canal.
7. Finalizar el stream: el canal pasa a "no está en vivo" en los dos navegadores.
8. Cambiar la contraseña, cerrar sesión y entrar con la nueva.
9. Borrar la cuenta (mejor con una cuenta de prueba).

Todo el recorrido se puede hacer solo con el teclado: Tab para moverse, Enter para activar y Escape para cerrar los modales y el menú.

## 11. Problemas comunes

| Problema | Causa y solución |
|---|---|
| `Port 5173 is already in use` | Otro proceso usa el puerto. Ciérralo: el CORS del backend solo acepta el 5173. |
| "No pudimos conectar con el servidor." | El backend no está corriendo o `VITE_API_URL` apunta a otro lado. |
| OBS: "No se pudo acceder al canal especificado o clave de transmisión" | Pulsa **Iniciar stream** en el estudio antes de iniciar la transmisión en OBS. |
| El campo del código tiene más o menos casillas que el código del correo | `VITE_OTP_LENGTH` no coincide con "Email OTP Length" de Supabase. Corrígelo y reinicia `pnpm dev`. |
| El canal dice "Conectando…" un rato | El paso a en vivo tarda unos segundos (el backend revisa cada 3 s, más el retraso del HLS). Si no termina, revisa que MediaMTX esté corriendo. |
| El video arranca en silencio | Los navegadores bloquean el sonido automático. Usa "Activar sonido": la app recuerda tu elección. |
