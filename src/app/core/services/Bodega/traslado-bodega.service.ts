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

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<TrasladoBodegasView>> {
    let params = new HttpParams()
      .set('page', page.toString())//Pagina
      .set('size', size.toString())//Cantidad de registros a validar

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<TrasladoBodegasView>>(this.url + "pagination", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar el traslado.');
        }

        return response.data;
      })
    );
  }

  getTrasladoById(id: number): Observable<TrasladoBodegas> {
    const params = new HttpParams()
      .set('id_trans', id);
    return this.http.get<TrasladoBodegas>(this.url + "search", { params });
  }

  //Editar traslado entre bodegas
  edit(objecto: any, id_trans: number): Observable<any> {
    const params = new HttpParams().set('id_trans', String(id_trans));

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el traslado.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('id_trans', id.toString());
    return this.http.delete<void>(this.url + "delete", { params });
  }

}
