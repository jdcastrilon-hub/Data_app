import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MonitorOperacionesFiltros } from '../../interfaces/Comercial/MonitorOperacionesFiltros';
import { MonitorVentasvista1 } from '../../interfaces/Comercial/MonitorVentasvista1';
import { MonitorVentaReportePrecios } from '../../interfaces/Comercial/MonitorVentaReportePrecios';
import { PrecioHistorialLinea } from '../../interfaces/Comercial/PrecioHistorialLinea';
import { LoginService } from '../core/login.service';

@Injectable({
  providedIn: 'root'
})
export class MonitoroperacionesService {

  private url: string = `${environment.baseUrl}/comercial/monitoroperaciones/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  filtrosgenerales(): Observable<MonitorOperacionesFiltros> {
    const params = new HttpParams()
      .set('id_empresa', String(this.loginService.getIdEmpresaActual()))
    return this.http.get<MonitorOperacionesFiltros>(this.url + "filtros", { params });
  }

  private construirParamsVentasRealizadas(filtros: any): HttpParams {
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
    if (filtros.id_caja) {
      params = params.set('id_caja', filtros.id_caja.toString());
    }
    if (filtros.soloConDescuento) {
      params = params.set('solo_con_descuento', 'true');
    }
    if (filtros.tiposDocumento && filtros.tiposDocumento.length) {
      filtros.tiposDocumento.forEach((tipo: string) => {
        params = params.append('tipos_documento', tipo);
      });
    }
    if (filtros.clientes && filtros.clientes.length) {
      filtros.clientes.forEach((idCliente: number) => {
        params = params.append('clientes', idCliente.toString());
      });
    }
    if (filtros.articulos && filtros.articulos.length) {
      filtros.articulos.forEach((idArticulo: number) => {
        params = params.append('articulos', idArticulo.toString());
      });
    }

    return params;
  }

  ventasrealizadas(page: number, size: number, filtros: any): Observable<MonitorVentasvista1> {
    let params = this.construirParamsVentasRealizadas(filtros);
    params = params.set('page', page);
    params = params.set('size', size);

    return this.http.get<MonitorVentasvista1>(this.url + "ventasrealizadas", { params });
  }

  private construirParamsPrecios(filtros: any): HttpParams {
    let params = new HttpParams()
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));

    const valorLista = filtros.lista === 'TODOS' || !filtros.lista ? 0 : filtros.lista;
    params = params.set('lista', valorLista.toString());

    const valorNegocio = filtros.negocio === 'TODOS' || !filtros.negocio ? 0 : filtros.negocio;
    params = params.set('negocio', valorNegocio.toString());

    const valorCategoria = filtros.categoria === 'TODOS' || !filtros.categoria ? 0 : filtros.categoria;
    params = params.set('categoria', valorCategoria.toString());

    const valorSubcategoria = filtros.subcategoria === 'TODOS' || !filtros.subcategoria ? 0 : filtros.subcategoria;
    params = params.set('subcategoria', valorSubcategoria.toString());

    if (filtros.articulos && filtros.articulos.length) {
      filtros.articulos.forEach((idArticulo: number) => {
        params = params.append('articulos', idArticulo.toString());
      });
    }

    return params;
  }

  reporteprecios(page: number, size: number, filtros: any): Observable<MonitorVentaReportePrecios> {
    let params = this.construirParamsPrecios(filtros);
    params = params.set('page', page);
    params = params.set('size', size);

    return this.http.get<MonitorVentaReportePrecios>(this.url + "precios", { params });
  }

  exportarPrecios(filtros: any): Observable<Blob> {
    const params = this.construirParamsPrecios(filtros);
    return this.http.get(this.url + "precios/export", { params, responseType: 'blob' });
  }

  precioHistorial(idArticulo: number, idLista: number): Observable<PrecioHistorialLinea[]> {
    const params = new HttpParams()
      .set('id_emp', String(this.loginService.getIdEmpresaActual()))
      .set('id_articulo', idArticulo.toString())
      .set('id_lista', idLista.toString());

    return this.http.get<PrecioHistorialLinea[]>(this.url + "precios/historial", { params });
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
