import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UsuarioSearch } from '../../interfaces/Core/UsuarioSearch';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private url: string = `${environment.baseUrl}/core/usuarios/`;

  constructor(private http: HttpClient) { }

  usuarioSearch(query: string): Observable<UsuarioSearch[]> {
    const params = new HttpParams()
      .set('query', String(query));
    return this.http.get<UsuarioSearch[]>(this.url + "search", { params });
  }
}
