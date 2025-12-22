import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EmpresaSucursalBodegas } from '../../models/Bodega/EmpresaSucursalBodegas';
import { ReporteInventarioxBodega } from '../../models/Bodega/Reportes/ReporteInventarioxBodega';
import { PageResponse } from '../../models/core/PageResponse';

interface ApiResponse {
  status: string; // Definición clara como string
  message: string;
  data: ReporteInventarioxBodega;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteInventarioServiceService {

  private url: string = 'http://localhost:8080/api/bodega/reporteinventario/';

  constructor(private http: HttpClient) { }


  list(): Observable<EmpresaSucursalBodegas[]> {
    return this.http.get<EmpresaSucursalBodegas[]>(this.url + "filtroEmpresa");
  }

  generarReportexBodega(): Observable<Blob> {
    const url = this.url + "inventarioBodegaPDF";

    return this.http.get(url, {
      responseType: 'blob',
      // Agrega tu Authorization header aquí si es necesario:
      // headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  generarReportexBodegaPage(page: number, size: number): Observable<PageResponse<ReporteInventarioxBodega>> {
    const params = new HttpParams()
      .set('page', page.toString())//Pagina 
      .set('size', size.toString())//Cantidad de registros a validar
    //.set('sort','fechaMod,desc');//Ordenamiento de la lista

    return this.http.get<PageResponse<ReporteInventarioxBodega>>(this.url + "inventarioBodegaPage", { params });
  }
}
