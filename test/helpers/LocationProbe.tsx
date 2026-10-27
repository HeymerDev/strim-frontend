import { useLocation } from 'react-router';

/** Muestra la ruta actual en las rutas que la prueba no definió: "Ruta: /login?next=%2Fdashboard". */
export function LocationProbe() {
  const location = useLocation();
  return <p>{`Ruta: ${location.pathname}${location.search}`}</p>;
}
