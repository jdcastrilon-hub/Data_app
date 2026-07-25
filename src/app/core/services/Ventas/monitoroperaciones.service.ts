import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MonitorOperacionesFiltros } from '../../interfaces/Comercial/MonitorOperacionesFiltros';
import { MonitorVentasvista1 } from '../../interfaces/Comercial/MonitorVentasvista1';
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
