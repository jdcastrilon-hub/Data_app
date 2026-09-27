import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PageResponse } from '../../models/core/PageResponse';
import { PrestamoListView } from '../../interfaces/Prestamos/PrestamoListView';
import { Prestamo } from '../../models/Prestamos/Prestamo';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class PrestamoService {

  private url: string = `${environment.baseUrl}/prestamos/`;

  constructor(private http: HttpClient) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<PrestamoListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<PrestamoListView>>(this.url + "pagination", { params });
  }

  getById(id: number): Observable<Prestamo> {
    const params = new HttpParams().set('id', id);
    return this.http.get<Prestamo>(this.url + "search", { params });
  }

  // Origina un prestamo (cabecera + cronograma, single round-trip).
  save(objeto: any): Observable<{ idTrans: number }> {
    return this.http.post<ApiResponse<{ idTrans: number }>>(this.url + "save", objeto).pipe(
      map((response: ApiResponse<{ idTrans: number }>) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al originar el préstamo.');
        }
        return response.data!;
      })
    );
  }
}
