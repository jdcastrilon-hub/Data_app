import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HistorialAjusteCosto } from '../../interfaces/Compras/HistorialAjusteCosto';

interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}


@Injectable({
  providedIn: 'root'
})
export class AjustecostoService {

  private url: string = `${environment.baseUrl}/compras/ajustecosto/`;

  constructor(private http: HttpClient) { }

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

  historial(idArticulo: number, idBodega: number): Observable<HistorialAjusteCosto[]> {
    const params = new HttpParams()
      .set('id_articulo', idArticulo.toString())
      .set('id_bodega', idBodega.toString());
    return this.http.get<HistorialAjusteCosto[]>(this.url + "historial", { params });
  }
}
