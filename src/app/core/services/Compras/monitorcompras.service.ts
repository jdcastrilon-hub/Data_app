import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { monitorComprasvista1 } from '../../interfaces/Compras/monitorComprasvista1';
import { PageResponse } from '../../models/core/PageResponse';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MonitorcomprasService {

  private url: string = `${environment.baseUrl}/compras/monitor/`;

  constructor(private http: HttpClient) { }

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
