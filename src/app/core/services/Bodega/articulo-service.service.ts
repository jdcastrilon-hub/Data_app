import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Articulo } from '../../models/Bodega/Articulo';
import { map, Observable } from 'rxjs';
import { ArticuloDTO } from '../../models/Bodega/ArticuloDTO';
import { ArticuloSearch } from '../../models/Bodega/ArticuloSearch';
import { environment } from 'src/environments/environment';

interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}

@Injectable({
  providedIn: 'root'
})
export class ArticuloServiceService {

  private url: string = `${environment.baseUrl}/bodega/articulos/`;

  constructor(private http: HttpClient) { }

  list(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(this.url + "list");
  }

  getEdition(objecto: Articulo): Observable<ArticuloDTO> {
    const params = new HttpParams()
      .set('id', String(objecto.id_articulo));
    console.log("getEdition");
    console.log(objecto.id_articulo);
    return this.http.get<ArticuloDTO>(this.url + "getedition", { params });
  }

  //Guardar Articulo
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar el articulo.');
        }
        return response.data;
      })
    );
  }


  update(objecto: Articulo): Observable<Articulo> {
    const params = new HttpParams()
      .set('id', String(objecto.id_articulo));
    return this.http.put<Articulo>(this.url + "update", objecto, { params });
  }

  //Servicios adicionales

  Search(query: string): Observable<ArticuloSearch[]> {
    const params = new HttpParams()
      .set('query', String(query));
    return this.http.get<ArticuloSearch[]>(this.url + "search", { params });
  }

}
