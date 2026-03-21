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

  listPaginacion(page: number, size: number): Observable<PageResponse<CompraListView>> {
    const params = new HttpParams()
      .set('page', page.toString())//Pagina 
      .set('size', size.toString())//Cantidad de registros a validar
      .set('idempresa', 1)//Cantidad de registros a validar

    return this.http.get<PageResponse<CompraListView>>(this.url + "pagination", { params });
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
}
