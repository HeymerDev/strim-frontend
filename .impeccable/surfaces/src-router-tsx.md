---
version: 1
slug: "src-router-tsx"
primary_target: "src/router.tsx"
related_targets: ["src/styles.css"]
---

# Superficie: app strim (todas las rutas)

- **Modo:** Operate. El visitante viene a ver un stream, comentar o transmitir.
- **Público y tareas:** espectadores (ver y comentar) y streamers (copiar datos de OBS, iniciar o finalizar, título). Detalle en `specs/requirements.md` y `specs/design.md`.
- **Restricciones:** solo modo oscuro, español, sin miniaturas de video, WCAG 2.1 AA, 360 px a escritorio.
- **Dirección elegida:** fijada por el usuario: el estilo del proyecto de Stitch y el logo, como base y no como copia (design.md §9).
- **Momento memorable:** el nodo de estado y el panel del estudio en `al-aire`.

## Direction contract

THESIS: El estado del canal se dibuja con el nodo de anillos del logo: hueco, anillos que se cierran o lleno sobre índigo. Rechaza el "app oscura con brillo neón y vidrio" del género: aquí el estado lo dicen la forma y un campo de color, no los brillos.

OWN-WORLD: Fondo noche índigo #12101f, paneles #1a1830 y #24213f con bordes de 1 px #312d52; cian #12c4e3 solo para la acción, el foco y los anillos; índigo #2410d0 solo significa "en vivo". Bricolage Grotesque pesada en los títulos y Figtree en el texto. Círculos para avatares y estados, cápsulas para botones, paneles de 20 px. Sin vidrio, brillos ni degradados.

STORY: El espectador entiende al instante quién está en vivo y entra a ver y leer el chat; el streamer copia sus datos, inicia y sabe que está al aire desde la otra pantalla.

FIRST VIEWPORT: Canal: barra de 56 px; video 16:9 a la izquierda (fluido) y chat de 360 px a la derecha a todo el alto; debajo del video, avatar, nombre, título en Bricolage y la insignia En vivo. Estudio: panel de estado a la izquierda con el nodo de 72 px, el estado en 39 px y la acción principal; a la derecha, Conectar OBS y la guía.

FORM: Producto de streaming estándar (video + chat lateral, barra superior) con un movimiento propio: el nodo de estado. Dirección fijada por el usuario, sin ronda de conceptos. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
