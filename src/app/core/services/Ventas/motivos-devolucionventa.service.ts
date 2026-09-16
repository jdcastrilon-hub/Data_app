import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MotivoDevolucionVenta } from '../../models/Comercial/MotivoDevolucionVenta';
import { map, Observable } from 'rxjs';
import { MotivoDevolucionVentaView } from '../../models/Comercial/MotivoDevolucionVentaView';
import { PageResponse } from '../../models/core/PageResponse';
import { environment } from 'src/environments/environment';
import { MotivoDevolucionVentaCombo } from '../../interfaces/Comercial/MotivoDevolucionVentaCombo';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class MotivosDevolucionVentaService {

  private url: string = `${environment.baseUrl}/comercial/motivosdevolucionventa/`;

  constructor(private http: HttpClient) { }

  listSelection(): Observable<MotivoDevolucionVentaCombo[]> {
    return this.http.get<MotivoDevolucionVentaCombo[]>(this.url + "listCombo");
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<MotivoDevolucionVentaView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<MotivoDevolucionVentaView>>(this.url + "pagination", { params });
  }

  getMotivoById(id: number): Observable<MotivoDevolucionVenta> {
    const params = new HttpParams().set('id_motivo', id);
    return this.http.get<MotivoDevolucionVenta>(this.url + "search", { params });
  }

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
