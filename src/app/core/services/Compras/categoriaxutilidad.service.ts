import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CategoriaXUtilidad } from '../../models/Compras/CategoriaXUtilidad';
import { CategoriaXUtilidadView } from '../../models/Compras/CategoriaXUtilidadView';
import { PageResponse } from '../../models/core/PageResponse';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaxutilidadService {

  private url: string = `${environment.baseUrl}/compras/categoriasxutilidad/`;

  constructor(private http: HttpClient) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<CategoriaXUtilidadView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<CategoriaXUtilidadView>>(this.url + "pagination", { params });
  }

  getById(id: number): Observable<CategoriaXUtilidad> {
    const params = new HttpParams().set('id', id);
    return this.http.get<CategoriaXUtilidad>(this.url + "search", { params });
  }

  save(objeto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objeto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar la configuración de utilidad.');
        }
        return response.data;
      })
    );
  }

  edit(objeto: any, id: number): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "edit/" + id, objeto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar la configuración de utilidad.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url + "delete/" + id);
  }
}
