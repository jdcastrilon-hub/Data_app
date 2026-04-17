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

  listPaginacion(page: number, size: number): Observable<PageResponse<AjusteStockListView>> {
    const params = new HttpParams()
      .set('page', page.toString())//Pagina 
      .set('size', size.toString())//Cantidad de registros a validar

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

  //Consulta Articulos de un registros de ajuste de Stock
  getArticulosById(id: number): Observable<AjusteStockInfoArticulos[]> {
    const params = new HttpParams()
      .set('id', id);

    return this.http.get<AjusteStockInfoArticulos[]>(this.url + "getArticulosById", { params });
  }

}
