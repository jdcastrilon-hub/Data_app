import { Injectable } from '@angular/core';
import { TrasladoBodegas } from '../../models/Bodega/TrasladoBodegas';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../../models/core/PageResponse';
import { TrasladoBodegasView } from '../../interfaces/Bodega/TrasladoBodegasView';

interface ApiResponse {
  status: string; // Definición clara como string
  message: string;
  data: TrasladoBodegas;
}

@Injectable({
  providedIn: 'root'
})
export class TrasladoBodegaService {

  private url: string = 'http://localhost:8080/api/bodega/trasladobodegas/';

  constructor(private http: HttpClient) { }

  listPaginacion(page: number, size: number): Observable<PageResponse<TrasladoBodegasView>> {
    const params = new HttpParams()
      .set('page', page.toString())//Pagina 
      .set('size', size.toString())//Cantidad de registros a validar

    return this.http.get<PageResponse<TrasladoBodegasView>>(this.url + "pagenation", { params });
  }

}
