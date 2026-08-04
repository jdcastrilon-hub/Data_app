import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Devolucion } from '../../models/Compras/Devolucion';
import { DevolucionListView } from '../../interfaces/Compras/DevolucionListView';
import { CompraOrigenBusqueda } from '../../interfaces/Compras/CompraOrigenBusqueda';
import { LineaDisponibleDevolucion } from '../../interfaces/Compras/LineaDisponibleDevolucion';
import { PageResponse } from '../../models/core/PageResponse';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class DevolucionComprasService {

  private url: string = `${environment.baseUrl}/compras/devolucioncompras/`;

  constructor(private http: HttpClient) { }

  // Compras Finalizadas del proveedor, candidatas a ser la "compra origen".
  // texto filtra por numero de documento o remito (autocompletar).
  comprasOrigen(idProveedor: number, texto?: string): Observable<CompraOrigenBusqueda[]> {
    let params = new HttpParams().set('id_proveedor', idProveedor);
    if (texto) {
      params = params.set('texto', texto);
    }
    return this.http.get<CompraOrigenBusqueda[]>(this.url + "comprasorigen", { params });
  }

  // Lineas de la compra origen, con el stock disponible actual y lo ya devuelto en
  // otras devoluciones de esta misma compra descontado. excluirIdTrans se envia al
  // editar una devolucion existente, para que no se reste a si misma.
  lineasDisponibles(idCompraOrigen: number, excluirIdTrans?: number): Observable<LineaDisponibleDevolucion[]> {
    let params = new HttpParams().set('id_compra_origen', idCompraOrigen);
    if (excluirIdTrans) {
      params = params.set('excluir_id_trans', excluirIdTrans);
    }
    return this.http.get<LineaDisponibleDevolucion[]>(this.url + "lineasdisponibles", { params });
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<DevolucionListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<DevolucionListView>>(this.url + "pagination", { params });
  }

  getDevolucionById(id: number): Observable<Devolucion> {
    const params = new HttpParams().set('transaccion', id);
    return this.http.get<Devolucion>(this.url + "search", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar la devolución.');
        }
        return response.data;
      })
    );
  }

  edit(id_trans: number, objecto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "edit/" + id_trans, objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar la devolución.');
        }
        return response.data;
      })
    );
  }

  delete(id_trans: number): Observable<void> {
    return this.http.delete<void>(this.url + "delete/" + id_trans);
  }
}
