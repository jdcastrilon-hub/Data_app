import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MonitorContratos } from '../../interfaces/Prestamos/ContratoPrestamoMonitor';

@Injectable({
  providedIn: 'root'
})
export class MonitorprestamosService {

  private url: string = `${environment.baseUrl}/prestamos/monitor/`;

  constructor(private http: HttpClient) { }

  private construirParams(filtros: any): HttpParams {
    let params = new HttpParams();

    if (filtros.fechaInicial) {
      params = params.set('fecha_inicial', this.formatDate(filtros.fechaInicial));
    }
    if (filtros.fechaFinal) {
      params = params.set('fecha_final', this.formatDate(filtros.fechaFinal));
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.clientes && filtros.clientes.length) {
      filtros.clientes.forEach((idCliente: number) => {
        params = params.append('clientes', idCliente.toString());
      });
    }

    return params;
  }

  contratos(page: number, size: number, filtros: any): Observable<MonitorContratos> {
    let params = this.construirParams(filtros);
    params = params.set('page', page);
    params = params.set('size', size);

    return this.http.get<MonitorContratos>(this.url + "contratos", { params });
  }

  exportarContratos(filtros: any): Observable<Blob> {
    const params = this.construirParams(filtros);
    return this.http.get(this.url + "contratos/export", { params, responseType: 'blob' });
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
