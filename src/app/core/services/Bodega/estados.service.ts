import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { EstadoListView } from '../../interfaces/Bodega/EstadoListView';
import { EstadoCombo } from '../../interfaces/Bodega/EstadoCombo';
import { Estado } from '../../models/Bodega/Estado';
import { PageResponse } from '../../models/core/PageResponse';
import { environment } from 'src/environments/environment';

interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}

@Injectable({
  providedIn: 'root'
})
export class EstadosService {

  private url: string = `${environment.baseUrl}/bodega/estados/`;

  constructor(private http: HttpClient) { }

  //Lista para seleccion de combox
  listSelection(): Observable<EstadoCombo[]> {
    return this.http.get<EstadoCombo[]>(this.url + "listCombo");
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<EstadoListView>> {
    let params = new HttpParams()
      .set('page', page.toString())//Pagina
      .set('size', size.toString())//Cantidad de registros a validar

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<EstadoListView>>(this.url + "pagination", { params });
  }

  //Guardar Estado
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar el estado.');
        }
        return response.data;
      })
    );
  }

  //Editar Estado
  edit(objecto: any, estado_id: number): Observable<any> {
    const params = new HttpParams()
      .set('estado_id', String(estado_id))

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el estado.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('estado_id', id.toString());

    return this.http.delete<void>(this.url + "delete", { params });
  }

  //Obtener estado por el ID
  getEstadoById(id: number): Observable<Estado> {
    const params = new HttpParams()
      .set('estado_id', id);
    return this.http.get<Estado>(this.url + "search", { params });
  }

}
