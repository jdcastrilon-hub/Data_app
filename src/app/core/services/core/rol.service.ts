import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Rol } from '../../models/core/Rol';
import { RolView } from '../../interfaces/Core/RolView';
import { RolCombo } from '../../interfaces/Core/PermisosMatriz';
import { PageResponse } from '../../models/core/PageResponse';
import { LoginService } from './login.service';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class RolService {

  private url: string = `${environment.baseUrl}/core/roles/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  // Combo liviano (sin superadmin) para el picker de rol dentro del
  // formulario de Usuario.
  listCombo(): Observable<RolCombo[]> {
    const params = new HttpParams().set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.get<RolCombo[]>(this.url + "listCombo", { params });
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<RolView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<RolView>>(this.url + "pagination", { params });
  }

  getRolById(id: number): Observable<Rol> {
    const params = new HttpParams()
      .set('id_rol', id)
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.get<Rol>(this.url + "search", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el rol.');
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
          throw new Error(response.message || 'Error desconocido al editar el rol.');
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
