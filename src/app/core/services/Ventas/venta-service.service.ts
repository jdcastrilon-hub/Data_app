import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ClienteSearch } from '../../interfaces/Comercial/ClienteSearch';


interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}

@Injectable({
  providedIn: 'root'
})
export class VentaServiceService {

  private url: string = `${environment.baseUrl}/comercial/ventas/`;

  constructor(private http: HttpClient) { }

  //Guardar Compra
  savepos(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "savepos", objecto).pipe(
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
