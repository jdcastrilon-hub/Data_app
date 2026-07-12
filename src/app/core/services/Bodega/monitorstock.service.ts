import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MonitorStockFiltroInventario } from '../../interfaces/Bodega/MonitorStockFiltroInventario';
import { MonitorStockVista1 } from '../../interfaces/Bodega/MonitorStockVista1';
import { MonitorStockValoracion } from '../../interfaces/Bodega/MonitorStockValoracion';
import { MonitorStockMinimo } from '../../interfaces/Bodega/MonitorStockMinimo';
import { MonitorVencimientos } from '../../interfaces/Bodega/MonitorVencimientos';
import { MovimientoStock } from '../../interfaces/Bodega/MovimientoStock';
import { LoginService } from '../core/login.service';

@Injectable({
  providedIn: 'root'
})
export class MonitorstockService {

  private url: string = `${environment.baseUrl}/bodega/monitor/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  filtrosvistainventrio(): Observable<MonitorStockFiltroInventario> {
    const params = new HttpParams()
      .set('id_empresa', String(this.loginService.getIdEmpresaActual()))
    return this.http.get<MonitorStockFiltroInventario>(this.url + "filtrovista1", { params });
  }



  private construirParamsFiltros(filtros: any): HttpParams {
    let params = new HttpParams()
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));

    if (filtros.bodega) {
      const valorBodega = filtros.bodega === 'TODOS' ? 0 : filtros.bodega;
      params = params.set('bodega', valorBodega.toString());
    }

    if (filtros.negocio) {
      const valornegocio = filtros.negocio === 'TODOS' ? 0 : filtros.negocio;
      params = params.set('negocio', valornegocio.toString());
    }

    if (filtros.categoria) {
      const valorcategoria = filtros.categoria === 'TODOS' ? 0 : filtros.categoria;
      params = params.set('categoria', valorcategoria.toString());
    }

    if (filtros.subcategoria) {
      const valorsubcategoria = filtros.subcategoria === 'TODOS' ? 0 : filtros.subcategoria;
      params = params.set('subcategoria', valorsubcategoria.toString());
    }

    if (filtros.articulos && filtros.articulos.length) {
      filtros.articulos.forEach((idArticulo: number) => {
        params = params.append('articulos', idArticulo.toString());
      });
    }

    return params;
  }

  monitorinventario(tipoReporte: string, page: number, size: number, filtros: any): Observable<MonitorStockVista1> {
    console.log("API")
    console.log(filtros);

    let params = this.construirParamsFiltros(filtros);
    params = params.set('page', page);
    params = params.set('size', size);

    return this.http.get<MonitorStockVista1>(this.url + "inventario", { params });
  }

  exportarInventario(filtros: any): Observable<Blob> {
    const params = this.construirParamsFiltros(filtros);
    return this.http.get(this.url + "inventario/export", { params, responseType: 'blob' });
  }

  monitorvaloracion(page: number, size: number, filtros: any): Observable<MonitorStockValoracion> {
    let params = this.construirParamsFiltros(filtros);
    params = params.set('page', page);
    params = params.set('size', size);

    return this.http.get<MonitorStockValoracion>(this.url + "valoracion", { params });
  }

  exportarValoracion(filtros: any): Observable<Blob> {
    const params = this.construirParamsFiltros(filtros);
    return this.http.get(this.url + "valoracion/export", { params, responseType: 'blob' });
  }

  monitorstockminimo(page: number, size: number, filtros: any): Observable<MonitorStockMinimo> {
    let params = this.construirParamsFiltros(filtros);
    params = params.set('page', page);
    params = params.set('size', size);

    return this.http.get<MonitorStockMinimo>(this.url + "stockminimo", { params });
  }

  exportarStockMinimo(filtros: any): Observable<Blob> {
    const params = this.construirParamsFiltros(filtros);
    return this.http.get(this.url + "stockminimo/export", { params, responseType: 'blob' });
  }

  monitorvencimientos(page: number, size: number, filtros: any): Observable<MonitorVencimientos> {
    let params = this.construirParamsFiltros(filtros);
    params = params.set('page', page);
    params = params.set('size', size);

    return this.http.get<MonitorVencimientos>(this.url + "vencimientos", { params });
  }

  exportarVencimientos(filtros: any): Observable<Blob> {
    const params = this.construirParamsFiltros(filtros);
    return this.http.get(this.url + "vencimientos/export", { params, responseType: 'blob' });
  }

  kardexArticulo(idArticulo: number, idCodBarra: number, fechaInicial?: Date | null, fechaFinal?: Date | null): Observable<MovimientoStock[]> {
    let params = new HttpParams()
      .set('id_articulo', idArticulo.toString())
      .set('id_codbarra', idCodBarra.toString());

    if (fechaInicial) {
      params = params.set('fecha_inicial', fechaInicial.toISOString().substring(0, 10));
    }
    if (fechaFinal) {
      params = params.set('fecha_final', fechaFinal.toISOString().substring(0, 10));
    }

    return this.http.get<MovimientoStock[]>(this.url + "kardex", { params });
  }
}
