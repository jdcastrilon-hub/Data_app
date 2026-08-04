import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ModuloCombo, RolCombo, FormularioMatriz, ModuloEmpresa } from '../../interfaces/Core/PermisosMatriz';
import { MisPermisos } from '../../interfaces/Core/MisPermisos';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

export interface GuardarMatrizPayload {
  idRol: number;
  idModulo: number;
  otorgados: number[];
}

@Injectable({
  providedIn: 'root'
})
export class PermisosService {

  private url: string = `${environment.baseUrl}/core/permisos/`;

  constructor(private http: HttpClient) { }

  modulosCombo(): Observable<ModuloCombo[]> {
    return this.http.get<ModuloCombo[]>(this.url + "modulos");
  }

  rolesCombo(): Observable<RolCombo[]> {
    return this.http.get<RolCombo[]>(this.url + "roles");
  }

  getMatriz(idRol: number, idModulo: number): Observable<FormularioMatriz[]> {
    const params = new HttpParams()
      .set('id_rol', idRol)
      .set('id_modulo', idModulo);
    return this.http.get<FormularioMatriz[]>(this.url + "matriz", { params });
  }

  guardarMatriz(idRol: number, idModulo: number, otorgados: number[]): Observable<any> {
    const body: GuardarMatrizPayload = {
      idRol,
      idModulo,
      otorgados
    };
    return this.http.put<ApiResponse>(this.url + "matriz", body);
  }

  // Todos mis permisos (todas las acciones) en la empresa activa - lo consume
  // PermisosStateService para cachear y que el guard de rutas no tenga que
  // consultar al backend en cada navegacion. La empresa se deriva del JWT en
  // el backend, no se envia desde aqui.
  misPermisos(): Observable<MisPermisos> {
    return this.http.get<MisPermisos>(this.url + "mis-permisos");
  }

  // Habilitacion de modulos por empresa (autoservicio del superadmin) - ver
  // docs/tecnica/specs/core/delegacion-permisos-menu-exclusivo.md, Pieza 1.
  modulosEmpresa(): Observable<ModuloEmpresa[]> {
    return this.http.get<ModuloEmpresa[]>(this.url + "modulos-empresa");
  }

  actualizarModuloEmpresa(idModulo: number, activo: boolean): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "modulos-empresa", { idModulo, activo });
  }
}
