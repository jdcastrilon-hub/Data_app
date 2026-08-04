import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ListaPrecio } from '../../models/Ventas/ListaPrecio';
import { PageResponse } from '../../models/core/PageResponse';
import { ListaPrecioListView } from '../../interfaces/Comercial/ListaPrecioListView';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class ListaprecioService {

  private url: string = `${environment.baseUrl}/comercial/listaprecio/`;

  constructor(private http: HttpClient) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<ListaPrecioListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<ListaPrecioListView>>(this.url + "pagination", { params });
  }

  getListaPrecioById(id: number): Observable<ListaPrecio> {
    const params = new HttpParams().set('id_lista', id);
    return this.http.get<ListaPrecio>(this.url + "search", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar la lista de precios.');
        }
        return response.data;
      })
    );
  }

  edit(id: number, objecto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "edit/" + id, objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar la lista de precios.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url + "delete/" + id);
  }
}
