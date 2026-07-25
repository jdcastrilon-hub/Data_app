import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MovimientoCaja } from '../../models/Ventas/MovimientoCaja';
import { PageResponse } from '../../models/core/PageResponse';
import { MovCajaListView } from '../../interfaces/Comercial/MovCajaListView';
import { LoginService } from '../core/login.service';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class MovimientoCajaService {

  private url: string = `${environment.baseUrl}/comercial/movimientocaja/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<MovCajaListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('idempresa', String(this.loginService.getIdEmpresaActual()));

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<MovCajaListView>>(this.url + 'pagination', { params });
  }

  getMovCajaById(id: number): Observable<MovimientoCaja> {
    const params = new HttpParams().set('id', id);
    return this.http.get<MovimientoCaja>(this.url + 'search', { params });
  }

  // Solo hay creacion - no hay edicion/borrado para este modulo (registro contable).
  save(objeto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + 'save', objeto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el movimiento de caja.');
        }
        return response.data;
      })
    );
  }
}
