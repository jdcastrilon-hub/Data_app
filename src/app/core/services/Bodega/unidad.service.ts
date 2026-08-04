import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Unidad } from '../../models/Bodega/Unidad';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PageResponse } from '../../models/core/PageResponse';
import { UnidadListView } from '../../interfaces/Bodega/UnidadListView';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class UnidadService {

  private url: string = `${environment.baseUrl}/bodega/unidades/`;
  constructor(private http: HttpClient) { }

  list(): Observable<Unidad[]> {
    return this.http.get<Unidad[]>(this.url + "list");
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<UnidadListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<UnidadListView>>(this.url + "pagination", { params });
  }

  getUnidadById(id: number): Observable<Unidad> {
    const params = new HttpParams().set('unidad_id', id);
    return this.http.get<Unidad>(this.url + "search", { params });
  }

  //Guardar Unidad (idEmp va dentro del objecto, ya se persiste en la tabla)
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar la unidad.');
        }
        return response.data;
      })
    );
  }

  //Editar Unidad
  edit(objecto: any, id_unidad: number): Observable<any> {
    const params = new HttpParams().set('unidad_id', String(id_unidad));

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar la unidad.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('unidad_id', id.toString());
    return this.http.delete<void>(this.url + "delete", { params });
  }
}
