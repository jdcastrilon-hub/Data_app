import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Articulo } from '../../models/Bodega/Articulo';
import { Observable } from 'rxjs';
import { ArticuloSearch } from '../../models/Bodega/ArticuloSearch';
import { environment } from 'src/environments/environment';
import { registroarticuloCompra } from '../../interfaces/Compras/registroarticuloCompra';
import { PageResponse } from '../../models/core/PageResponse';
import { ArticuloListView } from '../../interfaces/Bodega/ArticuloListView';
import { LoteDisponible } from '../../interfaces/Bodega/LoteDisponible';
import { LoteReservado } from '../../interfaces/Bodega/LoteReservado';

interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}

@Injectable({
  providedIn: 'root'
})
export class ArticuloService {

  private url: string = `${environment.baseUrl}/bodega/articulos/`;

  constructor(private http: HttpClient) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<ArticuloListView>> {
    let params = new HttpParams()
      .set('page', page.toString())//Pagina
      .set('size', size.toString())//Cantidad de registros a validar

    if (texto) {
      params = params.set('texto', texto);
    }

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

  lotesArticulo(idArticulo: number): Observable<LoteDisponible[]> {
    const params = new HttpParams()
      .set('id_articulo', idArticulo.toString());

    return this.http.get<LoteDisponible[]>(this.url + "lotes", { params });
  }

  // Reserva un id real de lote (nextval) sin insertarlo en m_lotes; se materializa
  // recien cuando se guarda la transaccion que lo usa (ver form-ajuste/nuevosLotes).
  reservarLote(idArticulo: number, codigoLote: string): Observable<LoteReservado> {
    const params = new HttpParams()
      .set('id_articulo', idArticulo.toString())
      .set('codigo_lote', codigoLote);

    return this.http.get<LoteReservado>(this.url + "lotes/reservar", { params });
  }

}
