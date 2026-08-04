export const environment = {
    production: true,
    // Dinamico: si entras por localhost:4200 apunta a localhost:8000; si entras
    // desde otro PC de la red por la IP de esta maquina, apunta a esa misma IP.
    baseUrl: `http://${window.location.hostname}:8000`
};
