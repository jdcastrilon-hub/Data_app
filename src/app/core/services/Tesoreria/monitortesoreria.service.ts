import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FiltrosTesoreria } from '../../interfaces/Tesoreria/FiltrosTesoreria';
import { MonitorTesoreria } from '../../interfaces/Tesoreria/MovimientoTesoreria';

@Injectable({
  providedIn: 'root'
})
export class MonitortesoreriaService {

  private url: string = `${environment.baseUrl}/tesoreria/monitor/`;

  constructor(private http: HttpClient) { }

  filtrosgenerales(): Observable<FiltrosTesoreria> {
    return this.http.get<FiltrosTesoreria>(this.url + "filtros");
  }

  private construirParams(filtros: any): HttpParams {
    let params = new HttpParams();

    if (filtros.fechaInicial) {
      params = params.set('fecha_inicial', this.formatDate(filtros.fechaInicial));
    }
    if (filtros.fechaFinal) {
      params = params.set('fecha_final', this.formatDate(filtros.fechaFinal));
    }
    if (filtros.tipoCuenta) {
      params = params.set('tipo_cuenta', filtros.tipoCuenta);
    }
    if (filtros.idCaja) {
      params = params.set('id_caja', filtros.idCaja.toString());
    }
    if (filtros.idBanco) {
      params = params.set('id_banco', filtros.idBanco.toString());
    }
    if (filtros.idMediopago) {
      params = params.set('id_mediopago', filtros.idMediopago.toString());
    }
    if (filtros.vista) {
      params = params.set('vista', filtros.vista);
    }

    return params;
  }

  movimientos(page: number, size: number, filtros: any): Observable<MonitorTesoreria> {
    let params = this.construirParams(filtros);
    params = params.set('page', page);
    params = params.set('size', size);

    return this.http.get<MonitorTesoreria>(this.url + "movimientos", { params });
  }

  exportarMovimientos(filtros: any): Observable<Blob> {
    const params = this.construirParams(filtros);
    return this.http.get(this.url + "movimientos/export", { params, responseType: 'blob' });
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
