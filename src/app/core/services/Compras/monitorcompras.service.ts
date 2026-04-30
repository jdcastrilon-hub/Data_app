import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { monitorComprasvista1 } from '../../interfaces/Compras/monitorComprasvista1';
import { PageResponse } from '../../models/core/PageResponse';
import { Observable } from 'rxjs';
import { MonitorComprasFiltros } from '../../interfaces/Compras/MonitorComprasFiltros';
import { MonitorCompraReporteCostos } from '../../interfaces/Compras/MonitorCompraReporteCostos';

@Injectable({
  providedIn: 'root'
})
export class MonitorcomprasService {

  private url: string = `${environment.baseUrl}/compras/monitor/`;

  constructor(private http: HttpClient) { }

  filtrosgenerales(): Observable<MonitorComprasFiltros> {
    const params = new HttpParams()
      .set('id_empresa', String(1))
    return this.http.get<MonitorComprasFiltros>(this.url + "filtros", { params });
  }

  reportecostos(page: number, size: number, filtros: any): Observable<MonitorCompraReporteCostos> {
    let params = new HttpParams();
    console.log("API")
    console.log(filtros);

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


    params = params.set('page', page);
    params = params.set('size', size);

    console.log("parametros")
    console.log(params.get('fechainicial'));
    return this.http.get<MonitorCompraReporteCostos>(this.url + "costos", { params });
  }

  monitorcomprasrealizadas(tipoReporte: string, page: number, size: number, filtros: any): Observable<monitorComprasvista1> {
    let params = new HttpParams();

    // Agregamos los filtros dinámicamente si existen
    if (filtros.fechaInicio) {
      params = params.set('fechainicial', this.formatDate(filtros.fechaInicio));
    }
    if (filtros.fechaFin) {
      params = params.set('fechafinal', this.formatDate(filtros.fechaFin));
    }
    if (filtros.id_bodega && filtros.id_bodega !== 0) {
      //params = params.set('id_bodega', filtros.id_bodega.toString());
      params = params.set('id_bodega', filtros.id_bodega.toString());
    }

    if (filtros.proveedor) {
      params = params.set('id_proveedor', filtros.proveedor);
    }

    if (filtros.articulo) {
      params = params.set('articulo', filtros.articulo);
    }


    params = params.set('page', page);
    params = params.set('size', size);

    console.log("parametros")
    console.log(params.get('fechainicial'));
    return this.http.get<monitorComprasvista1>(this.url + "comprasrealizadas", { params });
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
