import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Empresas } from '../../models/core/Empresas';
import { Numerador } from '../../models/core/Numerador';
import { environment } from 'src/environments/environment';
import { LoginService } from './login.service';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class EmpresaServiceService {

  private url: string = `${environment.baseUrl}/core/empresas/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  list(): Observable<Empresas[]> {
    return this.http.get<Empresas[]>(this.url + "list");
  }

  numeradorNext(numerador: string): Observable<Numerador> {
     const params = new HttpParams()
      .set('numerador', numerador);
    return this.http.get<Numerador>(this.url + "numeradornext", { params });
  }

  // "Mi Empresa" (Administracion) - siempre la empresa activa de la sesion
  getMiEmpresa(): Observable<Empresas> {
    const params = new HttpParams().set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.get<Empresas>(this.url + "mi-empresa", { params });
  }

  updateMiEmpresa(objecto: any): Observable<any> {
    const params = new HttpParams().set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.put<ApiResponse>(this.url + "mi-empresa", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar la empresa.');
        }
        return response.data;
      })
    );
  }

}
