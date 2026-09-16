import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NotaFactura } from '../../models/Comercial/NotaFactura';
import { NotaFacturaListView } from '../../interfaces/Comercial/NotaFacturaListView';
import { FacturaOrigenBusqueda } from '../../interfaces/Comercial/FacturaOrigenBusqueda';
import { LineaDisponibleNotaCredito } from '../../interfaces/Comercial/LineaDisponibleNotaCredito';
import { PageResponse } from '../../models/core/PageResponse';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class DevolucionVentasService {

  private url: string = `${environment.baseUrl}/comercial/devolucionventas/`;

  constructor(private http: HttpClient) { }

  // Facturas del cliente, candidatas a ser la "factura origen". texto filtra
  // por numero de documento o serie (autocompletar).
  facturasOrigen(idCliente: number, texto?: string): Observable<FacturaOrigenBusqueda[]> {
    let params = new HttpParams().set('id_cliente', idCliente);
    if (texto) {
      params = params.set('texto', texto);
    }
    return this.http.get<FacturaOrigenBusqueda[]>(this.url + "facturasorigen", { params });
  }

  // Lineas de la factura origen, con el saldo disponible para devolver (lo ya
  // devuelto en otras notas de esta misma factura descontado). excluirIdTrans
  // se envia al editar una nota existente, para que no se reste a si misma.
  lineasDisponibles(idTransRef: number, excluirIdTrans?: number): Observable<LineaDisponibleNotaCredito[]> {
    let params = new HttpParams().set('id_trans_ref', idTransRef);
    if (excluirIdTrans) {
      params = params.set('excluir_id_trans', excluirIdTrans);
    }
    return this.http.get<LineaDisponibleNotaCredito[]>(this.url + "lineasdisponibles", { params });
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<NotaFacturaListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<NotaFacturaListView>>(this.url + "pagination", { params });
  }

  getNotaById(id: number): Observable<NotaFactura> {
    const params = new HttpParams().set('transaccion', id);
    return this.http.get<NotaFactura>(this.url + "search", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar la nota crédito.');
        }
        return response.data;
      })
    );
  }

  edit(id_trans: number, objecto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "edit/" + id_trans, objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar la nota crédito.');
        }
        return response.data;
      })
    );
  }

  delete(id_trans: number): Observable<void> {
    return this.http.delete<void>(this.url + "delete/" + id_trans);
  }
}
