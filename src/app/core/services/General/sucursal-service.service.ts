import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Sucursal } from '../../models/General/Sucursal';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SucursalCombo } from '../../interfaces/Core/SucursalCombo';
import { SucursalXCajas } from '../../interfaces/Comercial/SucursalXCajas';
import { SucursalView } from '../../interfaces/Core/SucursalView';
import { SucursalAdmin } from '../../models/core/SucursalAdmin';
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
export class SucursalServiceService {

  private url: string = `${environment.baseUrl}/core/sucursal/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  list(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.url + "list");
  }

  listCombo(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.url + "combo");
  }

  sucursalesxBodegas(): Observable<SucursalCombo[]> {
    const params = new HttpParams()
      .set('id_empresa', String(this.loginService.getIdEmpresaActual()))
    return this.http.get<SucursalCombo[]>(this.url + "comboBybodegas", { params });
  }

   sucursalesxCaja(usuario: string): Observable<SucursalXCajas[]> {
    const params = new HttpParams()
      .set('id_empresa', String(this.loginService.getIdEmpresaActual()))
      .set('usuario', usuario)
    return this.http.get<SucursalXCajas[]>(this.url + "comboBycajas", { params });
  }

  //CRUD de la pestaña Sucursales de Administracion

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<SucursalView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<SucursalView>>(this.url + "pagination", { params });
  }

  getSucursalById(id: number): Observable<SucursalAdmin> {
    const params = new HttpParams()
      .set('id_sucursal', id)
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.get<SucursalAdmin>(this.url + "search", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar la sucursal.');
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
          throw new Error(response.message || 'Error desconocido al editar la sucursal.');
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
