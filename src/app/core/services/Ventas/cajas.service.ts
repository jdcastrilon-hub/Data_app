import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Cajas } from '../../models/Ventas/Cajas';
import { PageResponse } from '../../models/core/PageResponse';
import { CajaListView } from '../../interfaces/Comercial/CajaListView';
import { CajaCombo } from '../../interfaces/Comercial/CajaCombo';
import { LoginService } from '../core/login.service';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class CajasService {

  private url: string = `${environment.baseUrl}/comercial/cajas/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<CajaListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('idempresa', String(this.loginService.getIdEmpresaActual()))

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<CajaListView>>(this.url + "pagination", { params });
  }

  //Cajas asociadas a un usuario (escenario sin turno abierto)
  porUsuario(idUsuario: number): Observable<CajaCombo[]> {
    const params = new HttpParams()
      .set('id_usuario', idUsuario)
      .set('idempresa', String(this.loginService.getIdEmpresaActual()));
    return this.http.get<CajaCombo[]>(this.url + "porusuario", { params });
  }

  //Obtener caja por el ID
  getCajaById(id: number): Observable<Cajas> {
    const params = new HttpParams().set('id', id);
    return this.http.get<Cajas>(this.url + "search", { params });
  }

  //Guardar caja
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar la caja.');
        }
        return response.data;
      })
    );
  }

  //Editar caja
  edit(id: number, objecto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "edit/" + id, objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar la caja.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url + "delete/" + id);
  }
}
