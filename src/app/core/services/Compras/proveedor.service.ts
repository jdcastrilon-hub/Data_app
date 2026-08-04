import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PersonaSearch } from '../../interfaces/Compras/PersonaSearch';
import { Proveedores } from '../../models/Compras/Proveedores';
import { ProveedorSearch } from '../../interfaces/Compras/ProveedorSearch';
import { environment } from 'src/environments/environment';
import { PageResponse } from '../../models/core/PageResponse';
import { ProveedorView } from '../../interfaces/Compras/ProveedorView';

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

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<ProveedorView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<ProveedorView>>(this.url + "pagination", { params });
  }


  ProveedorSearch(query: string): Observable<ProveedorSearch[]> {
    console.log("Service Search");
    const params = new HttpParams()
      .set('query', String(query));
    return this.http.get<ProveedorSearch[]>(this.url + "proveedorsearch", { params });
  }

  getProveedorById(id: number): Observable<Proveedores> {
    const params = new HttpParams().set('proveedor_id', id);
    return this.http.get<Proveedores>(this.url + "search", { params });
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

  //Editar Proveedor
  edit(objecto: any, id_proveedor: number): Observable<any> {
    const params = new HttpParams().set('proveedor_id', String(id_proveedor));

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el proveedor.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('proveedor_id', id.toString());
    return this.http.delete<void>(this.url + "delete", { params });
  }
}
