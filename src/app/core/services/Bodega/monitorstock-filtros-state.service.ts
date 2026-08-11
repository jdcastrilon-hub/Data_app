import { Injectable } from '@angular/core';
import { ArticuloSearch } from '../../models/Bodega/ArticuloSearch';

// Filtros que efectivamente se mandan a consultar (lo mismo que hoy emite
// "alConsultar" en cada filtros<tipo>.component.ts). "sucursal" no viaja aca
// porque no se envia al backend - solo dispara la cascada visual hacia el
// combo de Bodegas.
export interface FiltroInventarioValores {
  negocio: string | number;
  bodega: string | number;
  categoria: string | number;
  subcategoria: string | number;
  estado: string | number;
  soloAlzas: boolean;
  articulos: number[];
}

// Valoracion/StockMinimo/Vencimientos comparten hoy la misma forma de filtro,
// pero se declaran distintas (no un alias) a proposito: cada una es libre de
// crecer sus propios filtros sin arrastrar a las demas (ver ADR-003).
export interface FiltroValoracionValores {
  negocio: string | number;
  bodega: string | number;
  categoria: string | number;
  subcategoria: string | number;
  articulos: number[];
}
export interface FiltroStockMinimoValores {
  negocio: string | number;
  bodega: string | number;
  categoria: string | number;
  subcategoria: string | number;
  articulos: number[];
}
export interface FiltroVencimientosValores {
  negocio: string | number;
  bodega: string | number;
  categoria: string | number;
  subcategoria: string | number;
  articulos: number[];
}

// Todo lo necesario para restaurar la UI de un filtros<tipo>, no solo lo que
// se manda al backend: el id de sucursal (para reconstruir la cascada hacia
// Bodegas) y los articulos completos elegidos en la pestaña "Articulos" (el
// filtro solo guarda sus ids, la tabla de la UI necesita codigo/nombre).
export interface FiltroReporteState<TFiltro> {
  sucursalId: number | null;
  filtro: TFiltro;
  articulosSeleccionados: ArticuloSearch[];
}

/**
 * Recuerda, por tipo de reporte del Monitor de Stock, la ultima seleccion de
 * filtros que el usuario consulto. Se pierde con un F5 o al cerrar la pestaña
 * (ver docs/funcional/decisiones/patrones-frontend.md, "State Service
 * ligero") - no hace falta mas persistencia que esa para este caso.
 *
 * Por que hace falta: monitorstock.component.html muestra/oculta cada
 * vista<tipo> con @if segun "Tipo de Informe" - Angular destruye por completo
 * el componente que deja de estar visible (y con el, sus FormControl locales)
 * cada vez que se cambia de reporte. Sin este servicio, la seleccion del
 * usuario se pierde cada vez que vuelve al mismo reporte.
 *
 * Se guarda solo al presionar "Consultar" (enviarConsulta()), no en cada
 * cambio de campo - si el usuario cambia de reporte sin haber consultado, esa
 * seleccion a medio hacer no se restaura (se prefirio no guardar estado que
 * nunca se llego a consultar).
 */
@Injectable({
  providedIn: 'root'
})
export class MonitorstockFiltrosStateService {
  inventario: FiltroReporteState<FiltroInventarioValores> | null = null;
  valoracion: FiltroReporteState<FiltroValoracionValores> | null = null;
  stockminimo: FiltroReporteState<FiltroStockMinimoValores> | null = null;
  vencimientos: FiltroReporteState<FiltroVencimientosValores> | null = null;
}
