import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TasaImpuesto } from '../../models/Impuestos/TasaImpuesto';
import { TasasCombo } from '../../interfaces/Impuestos/TasasCombo';
import { TipoImpuestoCombo } from '../../interfaces/Impuestos/TipoImpuestoCombo';
import { Impuesto } from '../../models/Impuestos/Impuesto';
import { ImpuestoView } from '../../models/Impuestos/ImpuestoView';
import { PageResponse } from '../../models/core/PageResponse';
import { environment } from 'src/environments/environment';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class TasaImpuestoService {

  private url: string = `${environment.baseUrl}/impuesto/tasas/`;

  constructor(private http: HttpClient) { }

  // Usado por el formulario de articulos. La empresa de la sesion se toma del
  // JWT en el backend, no requiere que los llamadores manden nada.
  list(): Observable<TasaImpuesto[]> {
    return this.http.get<TasaImpuesto[]>(this.url + "list");
  }

  // Usado por compra-directa/venta-directa/venta-pos para el combo de impuestos.
  ListCombos(): Observable<TasasCombo[]> {
    return this.http.get<TasasCombo[]>(this.url + "listCombo");
  }

  // Catalogo global de tipos de impuesto (IVA, IVA2, ...), sin CRUD propio.
  listTiposImpuesto(): Observable<TipoImpuestoCombo[]> {
    return this.http.get<TipoImpuestoCombo[]>(this.url + "tipos/listCombo");
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<ImpuestoView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<ImpuestoView>>(this.url + "pagination", { params });
  }

  getImpuestoById(id: number): Observable<Impuesto> {
    const params = new HttpParams().set('id_impuesto', id);
    return this.http.get<Impuesto>(this.url + "search", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el impuesto.');
        }
        return response.data;
      })
    );
  }

  edit(objecto: any, id_impuesto: number): Observable<any> {
    const params = new HttpParams().set('id_impuesto', String(id_impuesto));

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el impuesto.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('id_impuesto', id.toString());
    return this.http.delete<void>(this.url + "delete", { params });
  }
}
