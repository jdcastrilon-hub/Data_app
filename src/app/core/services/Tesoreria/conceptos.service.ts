import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Conceptos } from '../../models/Tesoreria/Conceptos';
import { PageResponse } from '../../models/core/PageResponse';
import { ConceptoListView } from '../../interfaces/Tesoreria/ConceptoListView';
import { ConceptoCajaCombo } from '../../interfaces/Comercial/ConceptoCajaCombo';
import { LoginService } from '../core/login.service';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class ConceptosService {

  private url: string = `${environment.baseUrl}/tesoreria/conceptos/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<ConceptoListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('idempresa', String(this.loginService.getIdEmpresaActual()))

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<ConceptoListView>>(this.url + "pagination", { params });
  }

  // Conceptos activos asociados al usuario logueado, filtrados por signo
  // (1=Ingreso/-1=Gasto) - usado por Movimiento Caja (comercial).
  porUsuario(idUsuario: number, signo: number): Observable<ConceptoCajaCombo[]> {
    const params = new HttpParams()
      .set('id_usuario', idUsuario)
      .set('idempresa', String(this.loginService.getIdEmpresaActual()))
      .set('signo', signo);
    return this.http.get<ConceptoCajaCombo[]>(this.url + "porusuario", { params });
  }

  //Obtener concepto por el ID
  getConceptoById(id: number): Observable<Conceptos> {
    const params = new HttpParams().set('id', id);
    return this.http.get<Conceptos>(this.url + "search", { params });
  }

  //Guardar concepto
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el concepto.');
        }
        return response.data;
      })
    );
  }

  //Editar concepto
  edit(id: number, objecto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "edit/" + id, objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el concepto.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url + "delete/" + id);
  }
}
