import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UsuarioLogin } from '../../interfaces/Core/UsuarioLogin';
import { DetalleUserEmpresa } from '../../interfaces/Core/DetalleUserEmpresa';
import { DetalleUser } from '../../interfaces/Core/DetalleUserLogin';
import { CambiarEmpresaResponse } from '../../interfaces/Core/CambiarEmpresaResponse';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private url: string = `${environment.baseUrl}/auth/login/`;
  private urlAuth: string = `${environment.baseUrl}/auth`;

  constructor(private http: HttpClient) { }

  /**
   * Realiza la petición de Login al Backend
   */
  login(usuario: string, clave: string): Observable<UsuarioLogin> {
    const body = { usuario, clave };

    return this.http.post<UsuarioLogin>(this.url, body).pipe(
      tap(response => {
        console.log(response)
        // Si el login es exitoso, guardamos el token en el almacenamiento del navegador

        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('empresa', JSON.stringify(response.empresa));
        }

      })
    );
  }

  /**
   * Obtiene el token guardado
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obtiene la empresa activa del login (la que se muestra en el toolbar y que
   * el usuario puede cambiar si tiene permisos). Fuente única de verdad para
   * cualquier consulta que deba filtrarse por empresa — evitar volver a
   * hardcodear el id de empresa en los servicios.
   */
  getEmpresaActual(): DetalleUserEmpresa | null {
    const raw = localStorage.getItem('empresa');
    return raw ? JSON.parse(raw) : null;
  }

  getIdEmpresaActual(): number | null {
    return this.getEmpresaActual()?.idEmp ?? null;
  }

  /**
   * Usuario logueado actual (fuente única de verdad, evita hardcodear un
   * usuario de prueba en las pantallas, ver project_data_comercial_module).
   */
  getUsuarioActual(): DetalleUser | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  /**
   * Empresas activas a las que el usuario autenticado tiene acceso, para el
   * selector de cambio de empresa (modal-cambiar-empresa).
   */
  misEmpresas(): Observable<DetalleUserEmpresa[]> {
    return this.http.get<DetalleUserEmpresa[]>(`${this.urlAuth}/mis-empresas`);
  }

  /**
   * Cambia la empresa activa de la sesión sin volver a loguearse: pide un
   * token nuevo firmado con la empresa elegida y reemplaza el token/empresa
   * guardados. El interceptor de auth toma el token nuevo en la siguiente
   * petición sin cambios adicionales.
   */
  cambiarEmpresa(idEmp: number): Observable<CambiarEmpresaResponse> {
    return this.http.post<CambiarEmpresaResponse>(`${this.urlAuth}/cambiar-empresa`, { idEmp }).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('empresa', JSON.stringify(response.empresa));
        }
      })
    );
  }

  /**
   * Marca la empresa indicada como la que el login usara por defecto la
   * proxima vez que este usuario inicie sesion (ver modal-cambiar-empresa).
   * No afecta la sesion actual - no requiere token nuevo ni recarga.
   */
  marcarEmpresaPrincipal(idEmp: number): Observable<any> {
    return this.http.put(`${this.urlAuth}/empresa-principal`, { idEmp });
  }

  /**
   * Sincroniza pestañas cuando la sesión cambia en OTRA pestaña. El token y
   * la empresa activa viven en localStorage, que es compartido por todas
   * las pestañas del mismo origen — si el usuario cambia de empresa en la
   * pestaña 1, la pestaña 2 sigue mostrando datos ya renderizados de la
   * empresa vieja, pero el interceptor de auth usa el token NUEVO en su
   * siguiente petición (lee localStorage fresco cada vez). Eso puede
   * terminar guardando algo contra la empresa equivocada sin que el usuario
   * se entere. El evento 'storage' del navegador solo se dispara en las
   * pestañas que NO hicieron el cambio, así que esto nunca recarga la
   * pestaña activa que originó el cambio.
   *
   * Se llama una sola vez desde AppComponent. Recarga también si el token
   * se borra en otra pestaña (logout) — mismo riesgo de estado
   * desincronizado, la pestaña recargada cae sola al login vía authGuard.
   */
  sincronizarEntrePestañas(): void {
    const idEmpInicial = this.getIdEmpresaActual();

    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === 'empresa' && this.getIdEmpresaActual() !== idEmpInicial) {
        window.location.reload();
      }

      if (event.key === 'token' && event.newValue === null) {
        window.location.reload();
      }
    });
  }

  /**
   * Cierra la sesión limpiando el almacenamiento
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('empresa');
  }

  /**
   * Verifica si el usuario está logueado localmente
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

}
