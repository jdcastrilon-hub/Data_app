import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ConfPrestamo } from '../../models/Tesoreria/ConfPrestamo';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class ConfprestamoService {

  private url: string = `${environment.baseUrl}/tesoreria/confprestamo/`;

  constructor(private http: HttpClient) { }

  // Singleton por empresa - siempre devuelve algo (habilitados vacios si la
  // empresa todavia no ha configurado nada), nunca 404.
  getConfPrestamo(): Observable<ConfPrestamo> {
    return this.http.get<ConfPrestamo>(this.url + 'search');
  }

  // Guarda las dos grillas completas (periodicidades + formulas de la empresa)
  // en una sola llamada (single round-trip).
  save(objeto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + 'save', objeto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar la configuración de préstamos.');
        }
        return response.data;
      })
    );
  }
}
