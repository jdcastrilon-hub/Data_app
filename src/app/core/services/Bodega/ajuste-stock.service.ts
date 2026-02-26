import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AjusteStock } from '../../models/Bodega/AjusteStock';
import { map, Observable } from 'rxjs';
import { AjusteStockListView } from '../../models/Bodega/AjusteStockListView';
import { AjusteStockInfoArticulos } from '../../interfaces/Bodega/AjusteStockInfoArticulos';
import { environment } from 'src/environments/environment';

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

  list(): Observable<AjusteStockListView[]> {
    //const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqdWFuIiwiaWF0IjoxNzQ5OTI2NDQ3LCJleHAiOjE3NDk5MzAwNDd9.FO-f63ntqva-gAKTHnIFHHJQDgolbZUVABk1ed3XOx0'; // o donde tengas guardado el token
    //const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<AjusteStockListView[]>(this.url + "listPaginacion");
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
      .set('id', id);
    return this.http.get<AjusteStock>(this.url + "getAjusteStockById", { params });
  }

  //Consulta Articulos de un registros de ajuste de Stock
  getArticulosById(id: number): Observable<AjusteStockInfoArticulos[]> {
    const params = new HttpParams()
      .set('id', id);

    return this.http.get<AjusteStockInfoArticulos[]>(this.url + "getArticulosById", { params });
  }

}
