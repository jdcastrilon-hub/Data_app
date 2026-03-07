import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Ciudades } from '../../models/core/Ciudades';
import { PersonaSearch } from '../../interfaces/Compras/PersonaSearch';
import { Proveedores } from '../../models/Compras/Proveedores';
import { ProveedorSearch } from '../../interfaces/Compras/ProveedorSearch';
import { environment } from 'src/environments/environment';

interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}


@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  private url: string = `${environment.baseUrl}/compras/proveedor/`;

  constructor(private http: HttpClient) { }

  //List Ciudades
  ciudades(): Observable<Ciudades[]> {
    return this.http.get<Ciudades[]>(this.url + "Ciudades");
  }

  PersonaSearch(query: string): Observable<PersonaSearch[]> {
    console.log("Service Search");
    const params = new HttpParams()
      .set('query', String(query));
    return this.http.get<PersonaSearch[]>(this.url + "PersonaSearch", { params });
  }

  ProveedorSearch(query: string): Observable<ProveedorSearch[]> {
    console.log("Service Search");
    const params = new HttpParams()
      .set('query', String(query));
    return this.http.get<ProveedorSearch[]>(this.url + "proveedorsearch", { params });
  }


  //Guardar Proveedor
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
