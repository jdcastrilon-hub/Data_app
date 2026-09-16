import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ConfComercial } from '../../models/Ventas/ConfComercial';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class ConfcomercialService {

  private url: string = `${environment.baseUrl}/comercial/confcomercial/`;

  constructor(private http: HttpClient) { }

  // Singleton por empresa - siempre devuelve algo (valores por defecto si la
  // empresa todavia no ha guardado ninguna configuracion), nunca 404.
  getConfComercial(): Observable<ConfComercial> {
    return this.http.get<ConfComercial>(this.url + "search");
  }

  // Guarda la configuracion y la grilla completa de roles con descuento en
  // una sola llamada (single round-trip).
  save(objeto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "save", objeto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar la configuración comercial.');
        }
        return response.data;
      })
    );
  }
}
