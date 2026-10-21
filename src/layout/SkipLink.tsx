/** Primer elemento enfocable: salta la barra superior (diseño §12). */
export function SkipLink() {
  return (
    <a
      href="#contenido"
      className="sr-only rounded-full bg-senal px-4 py-2 font-semibold text-noche focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
    >
      Saltar al contenido
    </a>
  );
}
