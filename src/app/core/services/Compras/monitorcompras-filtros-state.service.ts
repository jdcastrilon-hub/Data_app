import { Injectable } from '@angular/core';
import { ArticuloSearch } from '../../models/Bodega/ArticuloSearch';
import { ProveedorSearch } from '../../interfaces/Compras/ProveedorSearch';

// Filtros que efectivamente se mandan a consultar en "Compras Realizadas" (lo
// mismo que hoy emite "alConsultar" en filtroscompras.component.ts).
export interface FiltroComprasRealizadasValores {
  id_sucursal: number;
  id_bodega: number;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  articulos: number[];
  proveedores: number[];
}

// Filtros que efectivamente se mandan a consultar en "Costos".
export interface FiltroCostosValores {
  negocio: string | number;
  bodega: string | number;
  categoria: string | number;
  subcategoria: string | number;
  soloAlzas: boolean;
  articulos: number[];
}

// Todo lo necesario para restaurar la UI de un filtros<tipo>, no solo lo que
// se manda al backend: el id de sucursal (para reconstruir la cascada hacia
// Bodegas) y los articulos completos elegidos en la pestaña "Articulos" (el
// filtro solo guarda sus ids, la tabla de la UI necesita codigo/nombre). Mismo
// patron que MonitorstockFiltrosStateService (ver ese archivo para el porque
// completo de esta forma).
export interface FiltroReporteState<TFiltro> {
  sucursalId: number | null;
  filtro: TFiltro;
  articulosSeleccionados: ArticuloSearch[];
}

// Compras Realizadas ademas tiene su propia pestaña "Proveedores" (Costos no
// la tiene), asi que necesita guardar tambien los proveedores completos
// elegidos ahi, no solo sus ids.
export interface FiltroComprasRealizadasState extends FiltroReporteState<FiltroComprasRealizadasValores> {
  proveedoresSeleccionados: ProveedorSearch[];
}

/**
 * Recuerda, por tipo de reporte del Monitor de Compras, la ultima seleccion de
 * filtros que el usuario consulto. Mismo patron y mismo motivo que
 * MonitorstockFiltrosStateService (Fronted/.../core/services/Bodega/monitorstock-filtros-state.service.ts):
 * monitorcompras.component.html tambien muestra/oculta cada vista<tipo> con
 * @if, y Angular destruye por completo el componente que deja de estar
 * visible (y con el, sus FormControl locales) cada vez que se cambia de
 * "Tipo de Informe". Sin este servicio, la seleccion del usuario se pierde
 * cada vez que vuelve al mismo reporte.
 *
 * Se guarda solo al presionar "Consultar" (enviarConsulta()), no en cada
 * cambio de campo - si el usuario cambia de reporte sin haber consultado, esa
 * seleccion a medio hacer no se restaura.
 */
@Injectable({
  providedIn: 'root'
})
export class MonitorcomprasFiltrosStateService {
  comprasRealizadas: FiltroComprasRealizadasState | null = null;
  costos: FiltroReporteState<FiltroCostosValores> | null = null;
}
