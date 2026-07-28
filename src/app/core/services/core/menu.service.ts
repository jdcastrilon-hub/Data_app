import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Menu } from '../../interfaces/Core/Menu';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private url: string = `${environment.baseUrl}/core/menu/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  obtenerMenu(): Observable<Menu[]> {
    const params = new HttpParams().set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.get<Menu[]>(this.url + "menuxuser", { params });
  }
}
