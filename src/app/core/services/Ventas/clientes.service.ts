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
export class ClientesService {

  private url: string = `${environment.baseUrl}/comercial/clientes/`;

  constructor(private http: HttpClient) { }

  ClienteSearch(query: string): Observable<ClienteSearch[]> {
    console.log("Service Search");
    const params = new HttpParams()
      .set('query', String(query));
    return this.http.get<ClienteSearch[]>(this.url + "clientesearch", { params });
  }

  //Guardar Proveedor
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar cliente.');
        }
        return response.data;
      })
    );
  }
}
