import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UsuarioSearch } from '../../interfaces/Core/UsuarioSearch';
import { UsuarioView } from '../../interfaces/Core/UsuarioView';
import { Usuario } from '../../models/core/Usuario';
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
export class UsuariosService {

  private url: string = `${environment.baseUrl}/core/usuarios/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  // Acotado a los usuarios de la empresa actual (via md_empresaxuser) - lo usa
  // combo-usuario en roles/sucursales/cajas/conceptos para asignar usuarios.
  usuarioSearch(query: string): Observable<UsuarioSearch[]> {
    const params = new HttpParams()
      .set('query', String(query))
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.get<UsuarioSearch[]>(this.url + "search", { params });
  }

  listPaginacion(page: number, size: number, idEmp: number, texto?: string): Observable<PageResponse<UsuarioView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('id_emp', String(idEmp));

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<UsuarioView>>(this.url + "pagination", { params });
  }

  getUsuarioById(id: number, idEmp: number): Observable<Usuario> {
    const params = new HttpParams()
      .set('usuario_id', id)
      .set('id_emp', String(idEmp));
    return this.http.get<Usuario>(this.url + "detalle", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el usuario.');
        }
        return response.data;
      })
    );
  }

  edit(objecto: any, id_usuario: number, idEmp: number): Observable<any> {
    const params = new HttpParams()
      .set('usuario_id', String(id_usuario))
      .set('id_emp', String(idEmp));

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el usuario.');
        }
        return response.data;
      })
    );
  }
}
