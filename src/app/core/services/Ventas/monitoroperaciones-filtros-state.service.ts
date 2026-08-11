import { Injectable } from '@angular/core';
import { ArticuloSearch } from '../../models/Bodega/ArticuloSearch';

// Filtros que efectivamente se mandan a consultar en "Precios". A diferencia
// de Costos (Compras), no hay Sucursal/Bodega: el precio no tiene esa
// dimension (s_precioxarticulo es por lista, no por bodega) - "lista" ocupa
// el lugar que "bodega" tiene en el reporte de costos.
export interface FiltroPreciosValores {
  negocio: string | number;
  lista: string | number;
  categoria: string | number;
  subcategoria: string | number;
  articulos: number[];
}

export interface FiltroPreciosState {
  filtro: FiltroPreciosValores;
  articulosSeleccionados: ArticuloSearch[];
}

/**
 * Recuerda la ultima seleccion de filtros del reporte "Precios" del Monitor
 * de Ventas - mismo motivo que MonitorcomprasFiltrosStateService (Angular
 * destruye el componente de filtros al cambiar de "Tipo de Informe").
 */
@Injectable({
  providedIn: 'root'
})
export class MonitoroperacionesFiltrosStateService {
  precios: FiltroPreciosState | null = null;
}
