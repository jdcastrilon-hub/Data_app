import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Articulo } from '../../models/Bodega/Articulo';
import { Observable } from 'rxjs';
import { ArticuloSearch } from '../../models/Bodega/ArticuloSearch';
import { environment } from 'src/environments/environment';
import { registroarticuloCompra } from '../../interfaces/Compras/registroarticuloCompra';
import { PageResponse } from '../../models/core/PageResponse';
import { ArticuloListView } from '../../interfaces/Bodega/ArticuloListView';

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

  listPaginacion(page: number, size: number): Observable<PageResponse<ArticuloListView>> {
    const params = new HttpParams()
      .set('page', page.toString())//Pagina 
      .set('size', size.toString())//Cantidad de registros a validar

    return this.http.get<PageResponse<ArticuloListView>>(this.url + "pagination", { params });
  }

  //Obtener bodega por el ID
  getArticuloById(id: number): Observable<Articulo> {
    const params = new HttpParams()
      .set('id_articulo', id);
    return this.http.get<Articulo>(this.url + "search", { params });
  }

  //Actualizar stock de codigos de barra
  ActualizarStock(id_articulo: number, cadena: string): Observable<any> {
    const params = new HttpParams()
      .set('cadena', cadena.toString())
      .set('id_articulo', id_articulo)

    return this.http.get<any>(this.url + "stock-masivo", { params });
  }

  //Guardar Articulo
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto);
  }


  update(objecto: Articulo): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(this.url + "edit/" + objecto.id_articulo, objecto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url + "delete/" + id);
  }

  //Servicios adicionales

  SearchCodigoBarra(query: string): Observable<ArticuloSearch[]> {
    const params = new HttpParams()
      .set('query', String(query));
    return this.http.get<ArticuloSearch[]>(this.url + "searchCodigoBarra", { params });
  }

  SearchArticulo(query: string): Observable<ArticuloSearch[]> {
    const params = new HttpParams()
      .set('query', String(query));
    return this.http.get<ArticuloSearch[]>(this.url + "searchCodigoStock", { params });
  }
  //buscar si existe el codigo de barra
  SearchByCodigoBarra(id_articulo: number, codBarra: string): Observable<registroarticuloCompra> {
    const params = new HttpParams()
      .set('id_articulo', id_articulo)
      .set('cod_barra', String(codBarra));

    return this.http.get<registroarticuloCompra>(`${this.url}searchArticuloByCodigoBarra`, { params });
  }

}
