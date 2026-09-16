import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ConfCompras } from '../../models/Compras/ConfCompras';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class ConfcomprasService {

  private url: string = `${environment.baseUrl}/compras/confcompras/`;

  constructor(private http: HttpClient) { }

  // Singleton por empresa - siempre devuelve algo (valores por defecto si la
  // empresa todavia no ha guardado ninguna configuracion), nunca 404.
  getConfCompras(): Observable<ConfCompras> {
    return this.http.get<ConfCompras>(this.url + "search");
  }

  save(objeto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "save", objeto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar la configuración de compras.');
        }
        return response.data;
      })
    );
  }
}
