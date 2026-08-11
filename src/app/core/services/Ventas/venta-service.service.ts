import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ClienteSearch } from '../../interfaces/Comercial/ClienteSearch';
import { Ventas } from '../../models/Ventas/Ventas';
import { PageResponse } from '../../models/core/PageResponse';
import { VentaListView } from '../../interfaces/Comercial/VentaListView';
import { LoginService } from '../core/login.service';


interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}

@Injectable({
  providedIn: 'root'
})
export class VentaServiceService {

  private url: string = `${environment.baseUrl}/comercial/ventas/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  listPaginacion(page: number, size: number, texto?: string, vista?: string): Observable<PageResponse<VentaListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('idempresa', String(this.loginService.getIdEmpresaActual()))

    if (texto) {
      params = params.set('texto', texto);
    }
    if (vista) {
      params = params.set('vista', vista);
    }

    return this.http.get<PageResponse<VentaListView>>(this.url + "pagination", { params });
  }

  //Obtener venta por el ID
  getVentaById(id: number): Observable<Ventas> {
    const params = new HttpParams()
      .set('id_trans', id)
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.get<Ventas>(this.url + "search", { params });
  }

  // Recalcula stock+precio de varias lineas en una sola llamada - usado cuando
  // el usuario cambia bodega/estado/lista de precios con lineas ya cargadas.
  actualizarStockPrecios(cadena: string, idBodega: number, idEstado: number, idLista: number): Observable<any> {
    const params = new HttpParams()
      .set('cadena', cadena)
      .set('id_bodega', idBodega)
      .set('id_estado', idEstado)
      .set('id_lista', idLista);

    return this.http.get<any>(this.url + "stock-precio-masivo", { params });
  }

  //Guardar venta directa
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar la venta.');
        }
        return response.data;
      })
    );
  }

  //Editar venta directa
  edit(id_trans: number, objecto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "edit/" + id_trans, objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar la venta.');
        }
        return response.data;
      })
    );
  }

  //Guardar venta POS
  savepos(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "savepos", objecto).pipe(
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
