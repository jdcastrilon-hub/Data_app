import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ClienteSearch } from '../../interfaces/Comercial/ClienteSearch';
import { ClienteView } from '../../interfaces/Comercial/ClienteView';
import { Clientes } from '../../models/Ventas/Clientes';
import { PageResponse } from '../../models/core/PageResponse';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private url: string = `${environment.baseUrl}/comercial/clientes/`;

  constructor(private http: HttpClient) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<ClienteView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<ClienteView>>(this.url + "pagination", { params });
  }

  ClienteSearch(query: string): Observable<ClienteSearch[]> {
    const params = new HttpParams()
      .set('query', String(query));
    return this.http.get<ClienteSearch[]>(this.url + "clientesearch", { params });
  }

  getClienteById(id: number): Observable<Clientes> {
    const params = new HttpParams().set('cliente_id', id);
    return this.http.get<Clientes>(this.url + "search", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el cliente.');
        }
        return response.data;
      })
    );
  }

  edit(objecto: any, id_cliente: number): Observable<any> {
    const params = new HttpParams().set('cliente_id', String(id_cliente));

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el cliente.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('cliente_id', id.toString());
    return this.http.delete<void>(this.url + "delete", { params });
  }
}
