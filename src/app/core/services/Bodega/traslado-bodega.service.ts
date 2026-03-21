import { Injectable } from '@angular/core';
import { TrasladoBodegas } from '../../models/Bodega/TrasladoBodegas';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { PageResponse } from '../../models/core/PageResponse';
import { TrasladoBodegasView } from '../../interfaces/Bodega/TrasladoBodegasView';
import { environment } from 'src/environments/environment';

interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}

@Injectable({
  providedIn: 'root'
})
export class TrasladoBodegaService {

  private url: string = `${environment.baseUrl}/bodega/trasladobodega/`;

  constructor(private http: HttpClient) { }

  listPaginacion(page: number, size: number): Observable<PageResponse<TrasladoBodegasView>> {
    const params = new HttpParams()
      .set('page', page.toString())//Pagina 
      .set('size', size.toString())//Cantidad de registros a validar

    return this.http.get<PageResponse<TrasladoBodegasView>>(this.url + "pagenation", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar la categoría.');
        }

        return response.data;
      })
    );
  }


}
