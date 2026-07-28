import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ModuloCombo, RolCombo, FormularioMatriz } from '../../interfaces/Core/PermisosMatriz';
import { MisPermisos } from '../../interfaces/Core/MisPermisos';
import { LoginService } from './login.service';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

export interface GuardarMatrizPayload {
  idRol: number;
  idEmp: number;
  idModulo: number;
  otorgados: number[];
}

@Injectable({
  providedIn: 'root'
})
export class PermisosService {

  private url: string = `${environment.baseUrl}/core/permisos/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  modulosCombo(): Observable<ModuloCombo[]> {
    return this.http.get<ModuloCombo[]>(this.url + "modulos");
  }

  rolesCombo(): Observable<RolCombo[]> {
    const params = new HttpParams().set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.get<RolCombo[]>(this.url + "roles", { params });
  }

  getMatriz(idRol: number, idModulo: number): Observable<FormularioMatriz[]> {
    const params = new HttpParams()
      .set('id_rol', idRol)
      .set('id_emp', String(this.loginService.getIdEmpresaActual()))
      .set('id_modulo', idModulo);
    return this.http.get<FormularioMatriz[]>(this.url + "matriz", { params });
  }

  guardarMatriz(idRol: number, idModulo: number, otorgados: number[]): Observable<any> {
    const body: GuardarMatrizPayload = {
      idRol,
      idEmp: this.loginService.getIdEmpresaActual()!,
      idModulo,
      otorgados
    };
    return this.http.put<ApiResponse>(this.url + "matriz", body);
  }

  // Todos mis permisos (todas las acciones) en la empresa activa - lo consume
  // PermisosStateService para cachear y que el guard de rutas no tenga que
  // consultar al backend en cada navegacion.
  misPermisos(): Observable<MisPermisos> {
    const params = new HttpParams().set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.get<MisPermisos>(this.url + "mis-permisos", { params });
  }
}
