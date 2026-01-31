import { Injectable } from '@angular/core';
import { Compra } from '../../models/Compras/Compra';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

interface ApiResponse {
  status: string; // Definición clara como string
  message: string;
  data: Compra;
}


@Injectable({
  providedIn: 'root'
})
export class ComprasService {

  private url: string = 'http://localhost:8080/api/compras/proveedor/';

  constructor(private http: HttpClient) { }

  //Guardar Compra
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'ok') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar proveedor.');
        }
        return response.data;
      })
    );
  }
}
