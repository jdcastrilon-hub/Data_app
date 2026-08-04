import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MotivosDevolucion } from '../../models/Compras/MotivosDevolucion';
import { map, Observable } from 'rxjs';
import { MotivoDevolucionView } from '../../models/Compras/MotivoDevolucionView';
import { PageResponse } from '../../models/core/PageResponse';
import { environment } from 'src/environments/environment';
import { MotivoDevolucionCombo } from '../../interfaces/Compras/MotivoDevolucionCombo';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class MotivosDevolucionService {

  private url: string = `${environment.baseUrl}/compras/motivosdevolucion/`;

  constructor(private http: HttpClient) { }

  listSelection(): Observable<MotivoDevolucionCombo[]> {
    return this.http.get<MotivoDevolucionCombo[]>(this.url + "listCombo");
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<MotivoDevolucionView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<MotivoDevolucionView>>(this.url + "pagination", { params });
  }

  getMotivoById(id: number): Observable<MotivosDevolucion> {
    const params = new HttpParams().set('id_motivo', id);
    return this.http.get<MotivosDevolucion>(this.url + "search", { params });
  }

  //Guardar Motivo
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el motivo.');
        }
        return response.data;
      })
    );
  }

  //Editar Motivo
  edit(objecto: any, id_motivo: number): Observable<any> {
    const params = new HttpParams().set('id_motivo', String(id_motivo));

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el motivo.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('id_motivo', id.toString());
    return this.http.delete<void>(this.url + "delete", { params });
  }
}
