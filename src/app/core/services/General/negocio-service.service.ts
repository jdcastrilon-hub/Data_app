import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { NegocioxCategoriasDTO } from '../../models/General/NegocioxCategoriasDTO';
import { environment } from 'src/environments/environment';
import { EmpresaByNegocioCategorias } from '../../interfaces/Core/EmpresaByNegocioCategorias';
import { NegocioView } from '../../interfaces/Core/NegocioView';
import { NegocioAdmin } from '../../models/core/NegocioAdmin';
import { PageResponse } from '../../models/core/PageResponse';
import { LoginService } from '../core/login.service';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class NegocioServiceService {

  private url: string = `${environment.baseUrl}/core/negocios/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  listNegociosxCategoria(): Observable<EmpresaByNegocioCategorias> {
    const params = new HttpParams()
      .set('id_empresa', String(this.loginService.getIdEmpresaActual()))
    return this.http.get<EmpresaByNegocioCategorias>(this.url + "listByNegocios",{params});
  }

  //CRUD de la pestaña Negocios de Administracion

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<NegocioView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<NegocioView>>(this.url + "pagination", { params });
  }

  getNegocioById(id: number): Observable<NegocioAdmin> {
    const params = new HttpParams()
      .set('id_negocio', id)
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.get<NegocioAdmin>(this.url + "search", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el negocio.');
        }
        return response.data;
      })
    );
  }

  edit(id: number, objecto: any): Observable<any> {
    const params = new HttpParams().set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.put<ApiResponse>(this.url + "edit/" + id, objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el negocio.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.delete<void>(this.url + "delete/" + id, { params });
  }

}
