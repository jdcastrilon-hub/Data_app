import { Injectable } from '@angular/core';
import { Compra } from '../../models/Compras/Compra';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CompraListView } from '../../interfaces/Compras/CompraListView';
import { PageResponse } from '../../models/core/PageResponse';

interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}



@Injectable({
  providedIn: 'root'
})
export class ComprasService {

  private url: string = `${environment.baseUrl}/compras/compradirecta/`;

  constructor(private http: HttpClient) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<CompraListView>> {
    let params = new HttpParams()
      .set('page', page.toString())//Pagina
      .set('size', size.toString())//Cantidad de registros a validar
      .set('idempresa', 1)//Cantidad de registros a validar

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<CompraListView>>(this.url + "pagination", { params });
  }

  //Obtener compra por el ID
  getCompraById(id: number): Observable<Compra> {
    const params = new HttpParams()
      .set('transaccion', id);
    return this.http.get<Compra>(this.url + "search", { params });
  }

  ActualizarStockCostos(cadena: string, id_bodega: number, id_estado: number): Observable<any> {
    const params = new HttpParams()
      .set('cadena', cadena.toString())
      .set('id_bodega', id_bodega)
      .set('id_estado', id_estado)

    return this.http.get<any>(this.url + "stock-masivo", { params });
  }

  //Guardar Compra
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

  //Editar Compra
  edit(id_trans : number,objecto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "edit/"+id_trans, objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar la categoría.');
        }
        return response.data;
      })
    );
  }

  delete(id_trans: number): Observable<void> {
    return this.http.delete<void>(this.url + "delete/" + id_trans);
  }
}
