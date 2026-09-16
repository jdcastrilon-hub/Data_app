import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BancoListView } from '../../interfaces/Tesoreria/BancoListView';
import { BancoCombo } from '../../interfaces/Tesoreria/BancoCombo';
import { Banco } from '../../models/Tesoreria/Banco';
import { PageResponse } from '../../models/core/PageResponse';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class BancosService {

  private url: string = `${environment.baseUrl}/tesoreria/bancos/`;

  constructor(private http: HttpClient) { }

  //Lista para seleccion de combos (ej. Medio de Pago)
  listCombo(): Observable<BancoCombo[]> {
    return this.http.get<BancoCombo[]>(this.url + "listCombo");
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<BancoListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<BancoListView>>(this.url + "pagination", { params });
  }

  //Guardar Banco
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el banco.');
        }
        return response.data;
      })
    );
  }

  //Editar Banco
  edit(objecto: any, banco_id: number): Observable<any> {
    const params = new HttpParams()
      .set('banco_id', String(banco_id))

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el banco.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('banco_id', id.toString());
    return this.http.delete<void>(this.url + "delete", { params });
  }

  //Obtener banco por el ID
  getBancoById(id: number): Observable<Banco> {
    const params = new HttpParams().set('banco_id', id);
    return this.http.get<Banco>(this.url + "search", { params });
  }

}
