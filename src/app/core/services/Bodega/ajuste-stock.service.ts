import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AjusteStock } from '../../models/Bodega/AjusteStock';
import { map, Observable } from 'rxjs';
import { AjusteStockListView } from '../../models/Bodega/AjusteStockListView';
import { AjusteStockInfoArticulos } from '../../interfaces/Bodega/AjusteStockInfoArticulos';
import { environment } from 'src/environments/environment';
import { PageResponse } from '../../models/core/PageResponse';

interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}

@Injectable({
  providedIn: 'root'
})
export class AjusteStockService {

  private url: string = `${environment.baseUrl}/bodega/ajustestock/`;

  constructor(private http: HttpClient) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<AjusteStockListView>> {
    let params = new HttpParams()
      .set('page', page.toString())//Pagina
      .set('size', size.toString())//Cantidad de registros a validar

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<AjusteStockListView>>(this.url + "pagination", { params });
  }


  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar la categoría.');
        }

        return response.data;
      })
    );
  }

  getAjusteStokById(id: number): Observable<AjusteStock> {
    const params = new HttpParams()
      .set('id_trans', id);
    return this.http.get<AjusteStock>(this.url + "search", { params });
  }

  //Editar Ajuste de Stock
  edit(objecto: any, id_trans: number): Observable<any> {
    const params = new HttpParams().set('id_trans', String(id_trans));

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el ajuste.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('id_trans', id.toString());
    return this.http.delete<void>(this.url + "delete", { params });
  }

  //Consulta Articulos de un registros de ajuste de Stock
  getArticulosById(id: number): Observable<AjusteStockInfoArticulos[]> {
    const params = new HttpParams()
      .set('id', id);

    return this.http.get<AjusteStockInfoArticulos[]>(this.url + "getArticulosById", { params });
  }

}
