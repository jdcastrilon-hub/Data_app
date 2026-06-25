import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UsuarioLogin } from '../../interfaces/Core/UsuarioLogin';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private url: string = `${environment.baseUrl}/auth/login/`;

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
