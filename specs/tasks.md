# Strim · Frontend — Tareas

> **SDD fase 3 de 3** (Requerimientos → Diseño → Tareas)
> Estado: **aprobado (v1)**, en curso · Fecha: 2026-10-19
> Parte de [requirements.md](requirements.md) v1 (D1 a D5) y [design.md](design.md) v1 (D1 a D4), ambos aprobados.

**Cómo se usa este documento**
- Las tareas van en orden y cada una se apoya en las anteriores.
- Una tarea se marca `[x]` cuando su **Verificación** pasa en el navegador, con el backend corriendo.
- Las tareas marcadas **[tú]** las haces tú, porque usan tus programas o cuentas.
- Al terminar cada tarea te paso su commit (Conventional Commits) para que lo hagas tú.
- En todas las tareas: `pnpm typecheck` y `pnpm lint` sin errores, y la pantalla revisada a 1440 px y a 390 px de ancho.

---

## Fase 0 · Preparación

- [ ] **0.1 [tú] Backend en marcha**
  - En `backend/`: `npm run media:up` y `npm run dev`, con `FRONTEND_URL=http://localhost:5173` en su `.env`.
  - **Verificación:** `http://localhost:4000/api/health` responde `{ "ok": true }`.

- [ ] **0.2 [tú] OBS instalado**
  - Lo necesitan las tareas 9 a 13 y la 17. Hasta la 12, el video también se puede probar con ffmpeg, como en el backend. Para cambiar el título antes de que exista el estudio (tarea 10), se usa `backend/requests.http`.

## Fase 1 · Base del proyecto

- [x] **1. Inicializar el proyecto** · Vite 7.3, React 19.3, TS 5.9, Tailwind 4.3; `pnpm-workspace.yaml` aprueba el script de esbuild (pnpm 11 lo bloquea por defecto)
  - Crear la app con la plantilla `react-ts` de Vite usando pnpm, dentro de `frontend/`, sin borrar `specs/` ni `PRODUCT.md`.
  - Instalar las dependencias de la sección 13 del diseño.
  - `vite.config.ts`: plugin de React, plugin de Tailwind, puerto 5173 con `strictPort`.
  - `tsconfig`: modo estricto. Scripts `dev`, `build`, `preview`, `typecheck` y `lint`.
  - `.env.example` con `VITE_API_URL`, y `.gitignore` con `node_modules`, `dist` y `.env`.
  - Quitar el contenido de ejemplo de la plantilla.
  - **Verificación:** `pnpm install`, `pnpm typecheck`, `pnpm lint` y `pnpm build` terminan sin errores, y `pnpm dev` abre una página vacía en `http://localhost:5173`.
  - _RNF-01, RNF-02 · Diseño §2, §13_

- [x] **2. Tokens, fuentes y logo** · contrato de dirección en `.impeccable/surfaces/src-router-tsx.md`
  - `src/styles.css`: Tailwind, las dos fuentes de `@fontsource-variable` y los tokens de color, tipografía, radios y espaciado en `@theme` (diseño §9.3 a §9.5).
  - Estilos globales: fondo `noche`, texto `texto`, anillo de foco en `:focus-visible` y la regla de `prefers-reduced-motion`.
  - `public/favicon.svg` y el componente `Logo`: el símbolo de los cuatro nodos en SVG y la palabra "strim" con Bricolage (D1).
  - Brief de superficie de impeccable con el contrato de dirección (solo para desarrollo; no llega al navegador).
  - **Verificación:** el favicon se ve en la pestaña; el logo se ve nítido a 28 y 40 px; en DevTools, las fuentes cargan desde el propio servidor y no desde Google.
  - _RNF-07, RNF-08 · Diseño §9_

- [x] **3. Componentes base** · `TextAreaField` aparte de `Field`; `lib/format.ts` empieza con `initials` y `toneOf`
  - `src/components/`: `Button`, `IconButton`, `Field`, `PasswordField`, `OtpInput`, `CopyField`, `Modal`, `Avatar`, `StatusNode`, `LiveBadge`, `Stat`, `Toaster`, `Spinner`, `Skeleton` y `EmptyState` (diseño §9.8).
  - Una página `/dev/ui`, solo en desarrollo, que muestra cada componente en todos sus estados.
  - **Verificación** en `/dev/ui`:
    - Cada botón se ve en reposo, hover, foco, cargando y deshabilitado.
    - `OtpInput` acepta pegar el código completo y en el celular abre el teclado numérico.
    - `CopyField` copia al portapapeles y dice "Copiado"; el secreto se oculta y se muestra.
    - `Modal` cierra con Escape y devuelve el foco al botón que lo abrió.
    - `StatusNode` muestra los tres estados, y con "reducir movimiento" activado en el sistema los anillos quedan quietos.
    - Todo se puede usar solo con el teclado.
  - _RNF-04, RNF-05 · Diseño §9.5 a §9.8, §12_

- [x] **4. Tipos, cliente de API y validación** · la renovación del token queda como `setAuthBridge`, que conecta la tarea 5
  - `src/lib/types.ts`: los tipos de la API y de los eventos del socket, copiados del backend.
  - `src/lib/api.ts`: `ApiError`, la petición con token y la función de cada ruta (diseño §5.2). La renovación del token se conecta en la tarea 5.
  - `src/lib/validation.ts` (diseño §8) y `src/lib/format.ts` (tiempo en vivo, espectadores, hora e iniciales).
  - **Verificación** desde la consola del navegador, con `await import('/src/lib/api.ts')`:
    - `getLiveChannels()` devuelve un arreglo.
    - `getChannel('noexiste')` lanza `ApiError` con el código `NOT_FOUND`.
    - Con el backend apagado, cualquier llamada lanza `NETWORK_ERROR`.
  - _RF-16.1, RF-16.2, RNF-02 · Diseño §5.2, §8_

- [x] **5. Sesión, rutas y barra superior** · el usuario vive en el store de la sesión (no hay consulta `['me']`); "Cerrar sesión" ya está en el menú y se prueba en la tarea 7
  - `src/lib/session.ts`: store de la sesión, renovación programada y única, y sincronización entre pestañas (diseño §5.1). Conectar la renovación al cliente de la tarea 4.
  - `src/lib/queries.ts`: el `QueryClient` y los hooks de la sección 5.3 del diseño.
  - `src/router.tsx`: las rutas de la sección 4 del diseño, con `AppLayout`, `AuthLayout`, `RequireAuth`, `GuestOnly`, páginas diferidas y `safeNext`. Las páginas todavía vacías muestran solo su título.
  - `TopBar` y `UserMenu` (diseño §10.1), el enlace "Saltar al contenido", `NotFoundPage` y el título de cada pestaña.
  - **Verificación:**
    - Sin sesión, `/dashboard` lleva a `/login?next=%2Fdashboard`.
    - `/Ana` redirige a `/ana`; `/a` y `/hola/mundo` muestran la página no encontrada.
    - `/login?next=https://otro.sitio` no lleva fuera de la app después de iniciar sesión (se prueba en la tarea 7).
    - La barra se ve completa en escritorio y reducida en móvil.
  - _RF-01, RF-02.2, RF-02.5, RF-02.6, RF-16.5, RNF-03 · Diseño §4, §5.1, §5.3, §10.1_

## Fase 2 · Cuentas

- [x] **6. Crear cuenta y verificar el correo** · probado con respuestas simuladas del backend; falta la prueba con un correo real (tú)
  - `RegisterPage` y `VerifyPage` (diseño §10.6), con los errores de la API en sus campos (diseño §5.4).
  - Cuenta regresiva de 60 s para "Reenviar código" y el correo pendiente en `sessionStorage`.
  - **Verificación:**
    - Un username con mayúsculas se convierte a minúsculas al escribir; uno de 2 letras muestra el error antes de enviar.
    - Las reglas de la contraseña se marcan mientras se escribe.
    - Un registro nuevo lleva a `/verify` y el código del correo inicia la sesión.
    - Un código incorrecto muestra el error y vacía el campo.
    - Un correo ya verificado muestra "Ese correo ya está registrado." en el campo del correo.
    - Recargar `/verify` mantiene el correo; abrirla en otra pestaña nueva lleva a `/login`.
  - _RF-03, RF-04 · Diseño §5.4, §10.6_

- [x] **7. Iniciar y cerrar sesión** · credenciales malas probadas contra el backend real; lo demás con respuestas simuladas; falta la prueba con tu cuenta (tú)
  - `LoginPage`, con el caso `EMAIL_NOT_VERIFIED` (pide código nuevo y lleva a `/verify`).
  - "Cerrar sesión" en `UserMenu`.
  - **Verificación:**
    - Contraseña mala: error general, sin marcar un campo.
    - Login correcto: la barra muestra el avatar y el menú; al recargar sigue la sesión.
    - Login desde `/login?next=/settings` vuelve a `/settings`; con `next=https://otro.sitio` va a `/`.
    - Con dos pestañas abiertas, cerrar sesión en una la cierra en la otra.
    - Cambiar a mano el `accessToken` en `localStorage` por uno inválido y recargar: la app renueva el token sola y sigue con sesión.
    - Cambiar también el `refreshToken` por uno inválido: la app borra la sesión y `/dashboard` lleva a `/login`.
  - _RF-02, RF-05 · Diseño §5.1, §5.2_

- [x] **8. Recuperar la contraseña** · paso 1 contra el backend real; paso 2 con respuestas simuladas; falta la prueba con tu cuenta (tú). La cuenta regresiva quedó en `lib/useCooldown.ts`
  - `ResetPage` con sus dos pasos (diseño §10.6).
  - **Verificación:**
    - El paso 1 muestra el mismo mensaje con un correo que existe y con uno que no.
    - Con el código del correo y una contraseña nueva, lleva a `/login` con el correo escrito y el aviso "Contraseña actualizada. Inicia sesión.".
    - La contraseña nueva sirve para entrar y la vieja no.
  - _RF-06 · Diseño §10.6, §11_

## Fase 3 · Ver streams

- [x] **9. Inicio** · tarjetas probadas con canales simulados; falta verlo con un stream real (tareas 12 y 13). `staleTime` de 15 s para no repetir la petición en cada cambio de visibilidad
  - `HomePage` con las tarjetas, la carga con `Skeleton`, el estado vacío y el error con "Reintentar" (diseño §10.2).
  - **Verificación:**
    - Sin nadie en vivo se ve el estado vacío, y "Transmite tú" lleva a `/dashboard`.
    - Con un canal en vivo (OBS o ffmpeg) aparece su tarjeta en menos de 30 s sin recargar, y al cortar desaparece.
    - Con el backend apagado se ve el error, y "Reintentar" funciona al encenderlo.
    - La página no salta mientras carga.
  - _RF-07 · Diseño §5.3, §10.2_

- [x] **10. Socket y página del canal** · socket probado contra el backend real (conexión, NOT_FOUND, token rechazado); la página con un canal simulado y los eventos disparados en el cliente; falta con un stream real (tarea 12)
  - `src/lib/socket.ts` (diseño §6.1) y `useChatRoom` (diseño §6.2), por ahora sin la interfaz del chat.
  - `ChannelPage`: datos del canal, estado "Desconectado", canal borrado, página no encontrada, "Ir al estudio" para el dueño y la distribución de escritorio y móvil (diseño §10.3). El marco 16:9 queda listo para el reproductor.
  - **Verificación:**
    - Un canal desconectado muestra su avatar, su bio y "no está en vivo".
    - Al iniciar el stream desde OBS o ffmpeg, la página pasa a en vivo sin recargar, y los espectadores y el tiempo en vivo se actualizan.
    - Cambiar el título desde el backend (`PATCH /api/stream`) lo cambia en la página.
    - Al iniciar sesión o cerrarla, el socket se reconecta (se ve en la pestaña Network → WS).
    - `/noexiste` muestra "Este canal no existe".
  - _RF-08, RF-10.1, RF-10.8 · Diseño §6, §10.3_

- [x] **11. Chat** · probado con un canal simulado y el socket interceptado; falta con dos navegadores y el backend real (tú, tarea 17)
  - `ChatPanel`, `ChatMessage` y `ChatComposer` (diseño §6.3 y §10.3).
  - **Verificación:**
    - Al entrar se ven los últimos mensajes; uno nuevo aparece en las dos pestañas abiertas al mismo tiempo.
    - Un mensaje con `<b>hola</b>` se ve como texto, sin negrita.
    - Sin sesión se ve "Inicia sesión para comentar", y al entrar se vuelve al canal.
    - Mandar dos mensajes en menos de 1 s muestra "Vas muy rápido" y conserva el texto.
    - Subir para leer y recibir mensajes muestra "Mensajes nuevos" sin mover la vista.
    - Al apagar y encender el backend se ve "Reconectando…" y luego el chat vuelve con los mensajes.
    - Los mensajes del dueño llevan la insignia "Streamer".
  - _RF-10, RF-11 · Diseño §6.2, §6.3, §10.3_

- [x] **12. Reproductor** · probado con un HLS público de prueba (autoplay en silencio, controles, atajos, preferencias, reintentos y desmontaje); falta con OBS y tu canal (tú). hls.js va en su propio archivo de 592 kB que solo baja en el canal
  - `LivePlayer` con hls.js diferido, HLS nativo como respaldo, autoplay en silencio, "Activar sonido", controles, atajos, preferencias y reintentos (diseño §7).
  - **Verificación:**
    - Con OBS transmitiendo, el video arranca solo y en silencio; "Activar sonido" lo activa.
    - Al recargar, se recuerdan el volumen y el sonido.
    - Espacio, `m` y `f` funcionan con el reproductor enfocado.
    - Detener OBS sin finalizar el stream muestra "Conectando…"; al volver a transmitir, el video vuelve solo.
    - En la pestaña Network, hls.js solo se descarga en la página del canal.
  - _RF-09, RNF-08, RNF-09 · Diseño §7_

## Fase 4 · Transmitir

- [x] **13. Estudio** · probado con sesión y backend simulados (tres estados, título, iniciar, finalizar con confirmación, regenerar, vista previa y barra en vivo); falta con OBS y tu cuenta (tú)
  - `DashboardPage`: panel de estado con sus tres estados, título, iniciar y finalizar, credenciales de OBS, regenerar la clave, guía, vista previa y "Ver mi canal" (diseño §10.4).
  - `stream:state` actualiza el estudio y el botón "Transmitir" de la barra.
  - **Verificación:**
    - "Iniciar stream" pasa a "Esperando la señal de OBS"; al transmitir desde OBS pasa a "En vivo" con el panel en `al-aire` y la vista previa.
    - "Finalizar stream" en vivo pide confirmación, y OBS se desconecta.
    - "Guardar título" funciona en cualquier estado y el cambio se ve en el canal.
    - La clave está oculta, se muestra y se copia; en vivo, "Regenerar clave" está deshabilitado con su razón.
    - Regenerar la clave estando desconectado cambia el valor, y la clave vieja ya no sirve en OBS.
  - _RF-12, RF-01.4 · Diseño §7, §9.6, §10.4_

## Fase 5 · Ajustes

- [x] **14. Perfil y avatar** · probado con sesión y backend simulados; falta subir una foto real a tu cuenta (tú)
  - `SettingsPage` con el panel de perfil y la subida del avatar (diseño §10.5).
  - **Verificación:**
    - "Guardar cambios" solo se habilita con cambios, y al guardar la barra muestra el nombre y el avatar nuevos.
    - Un PDF o una imagen de 3 MB muestra el error sin enviarse.
    - Un username tomado muestra el error en su campo; en vivo, el campo está deshabilitado con su razón.
    - Sin avatar se ven las iniciales, en la barra, el chat y el canal.
  - _RF-13 · Diseño §5.4, §10.5_

- [ ] **15. Cambiar la contraseña y borrar la cuenta**
  - Los modales "Cambiar contraseña" y "Borrar cuenta" (diseño §10.5).
  - **Verificación:**
    - Contraseña actual incorrecta: error en ese campo y el modal sigue abierto.
    - Nueva igual a la actual: error en el campo de la nueva.
    - Cambio correcto: el modal se cierra, aparece "Contraseña actualizada" y la sesión sigue.
    - Borrar la cuenta con la contraseña correcta lleva a `/` con "Tu cuenta se borró" y sin sesión; su canal ya no existe.
  - _RF-14, RF-15 · Diseño §10.5_

## Fase 6 · Cierre

- [ ] **16. Revisión de diseño y accesibilidad**
  - Revisión con impeccable: detector, capturas a 1440 y 390 px, revisión final contra el contrato de dirección, y las correcciones que salgan.
  - `DESIGN.md` y `.impeccable/design.json` generados a partir de lo construido.
  - Pasada de accesibilidad: teclado de punta a punta, lector de pantalla en el chat y los formularios, contraste y "reducir movimiento".
  - **Verificación:** la revisión termina con veredicto `ship`, existe `DESIGN.md`, y todo el recorrido de la tarea 17 se puede hacer solo con el teclado.
  - _RNF-04, RNF-05, RNF-07_

- [ ] **17. README y prueba de punta a punta**
  - `frontend/README.md` corto: requisitos, `.env`, `pnpm install`, `pnpm dev` y la relación con el backend.
  - Quitar `/dev/ui` o confirmar que no entra en `pnpm build`.
  - **Verificación** (de punta a punta, en escritorio y en el celular):
    1. Crear la cuenta y verificar el correo.
    2. Editar el perfil y subir un avatar.
    3. Copiar los datos al OBS, iniciar el stream y verlo en el estudio.
    4. El canal aparece en el inicio.
    5. Otro navegador, sin sesión, ve el stream y lee el chat, pero no escribe.
    6. Ese navegador inicia sesión y comenta; el streamer lo ve en su canal.
    7. Finalizar el stream: el canal pasa a desconectado en los dos navegadores.
    8. Cambiar la contraseña, cerrar sesión y entrar con la nueva.
    9. Borrar la cuenta.

---

## Cobertura

| Requerimiento | Tarea |
|---|---|
| RF-01 | 5, 13 |
| RF-02 | 5, 7 |
| RF-03, RF-04 | 6 |
| RF-05 | 7 |
| RF-06 | 8 |
| RF-07 | 9 |
| RF-08 | 10 |
| RF-09 | 12 |
| RF-10, RF-11 | 10, 11 |
| RF-12 | 13 |
| RF-13 | 14 |
| RF-14, RF-15 | 15 |
| RF-16 | 3, 4, 5 |
| RNF-01 a RNF-09 | 1 a 5 (base), 16 (revisión), y se aplican en todas las demás |
