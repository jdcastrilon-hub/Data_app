import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { monitorComprasvista1 } from '../../interfaces/Compras/monitorComprasvista1';
import { PageResponse } from '../../models/core/PageResponse';
import { Observable } from 'rxjs';
import { MonitorComprasFiltros } from '../../interfaces/Compras/MonitorComprasFiltros';
import { MonitorCompraReporteCostos } from '../../interfaces/Compras/MonitorCompraReporteCostos';
import { DetalleCompraLinea } from '../../interfaces/Compras/DetalleCompraLinea';
import { DevolucionCompraLinea } from '../../interfaces/Compras/DevolucionCompraLinea';
import { LoginService } from '../core/login.service';

@Injectable({
  providedIn: 'root'
})
export class MonitorcomprasService {

  private url: string = `${environment.baseUrl}/compras/monitor/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  filtrosgenerales(): Observable<MonitorComprasFiltros> {
    const params = new HttpParams()
      .set('id_empresa', String(this.loginService.getIdEmpresaActual()))
    return this.http.get<MonitorComprasFiltros>(this.url + "filtros", { params });
  }

  private construirParamsCostos(filtros: any): HttpParams {
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

  reportecostos(page: number, size: number, filtros: any): Observable<MonitorCompraReporteCostos> {
    let params = this.construirParamsCostos(filtros);
    params = params.set('page', page);
    params = params.set('size', size);

    return this.http.get<MonitorCompraReporteCostos>(this.url + "costos", { params });
  }

  exportarCostos(filtros: any): Observable<Blob> {
    const params = this.construirParamsCostos(filtros);
    return this.http.get(this.url + "costos/export", { params, responseType: 'blob' });
  }

  private construirParamsComprasRealizadas(filtros: any): HttpParams {
    let params = new HttpParams()
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));

    if (filtros.fechaInicio) {
      params = params.set('fechainicial', this.formatDate(filtros.fechaInicio));
    }
    if (filtros.fechaFin) {
      params = params.set('fechafinal', this.formatDate(filtros.fechaFin));
    }
    if (filtros.id_sucursal) {
      params = params.set('id_sucursal', filtros.id_sucursal.toString());
    }
    if (filtros.id_bodega) {
      params = params.set('id_bodega', filtros.id_bodega.toString());
    }
    if (filtros.articulos && filtros.articulos.length) {
      filtros.articulos.forEach((idArticulo: number) => {
        params = params.append('articulos', idArticulo.toString());
      });
    }
    if (filtros.proveedores && filtros.proveedores.length) {
      filtros.proveedores.forEach((idProveedor: number) => {
        params = params.append('proveedores', idProveedor.toString());
      });
    }

    return params;
  }

  monitorcomprasrealizadas(tipoReporte: string, page: number, size: number, filtros: any): Observable<monitorComprasvista1> {
    let params = this.construirParamsComprasRealizadas(filtros);
    params = params.set('page', page);
    params = params.set('size', size);

    return this.http.get<monitorComprasvista1>(this.url + "comprasrealizadas", { params });
  }

  exportarComprasRealizadas(filtros: any): Observable<Blob> {
    const params = this.construirParamsComprasRealizadas(filtros);
    return this.http.get(this.url + "comprasrealizadas/export", { params, responseType: 'blob' });
  }

  detalleCompra(nroTrans: number): Observable<DetalleCompraLinea[]> {
    const params = new HttpParams().set('nro_trans', nroTrans.toString());
    return this.http.get<DetalleCompraLinea[]>(this.url + "comprasrealizadas/detalle", { params });
  }

  devolucionesCompra(nroTrans: number): Observable<DevolucionCompraLinea[]> {
    const params = new HttpParams().set('nro_trans', nroTrans.toString());
    return this.http.get<DevolucionCompraLinea[]>(this.url + "comprasrealizadas/devoluciones", { params });
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

}
