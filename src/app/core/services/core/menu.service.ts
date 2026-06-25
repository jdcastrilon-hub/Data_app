import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Menu } from '../../interfaces/Core/Menu';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private url: string = `${environment.baseUrl}/core/menu/`;

  constructor(private http: HttpClient) { }

  obtenerMenu(): Observable<Menu[]> {

    return this.http.get<Menu[]>(this.url + "menuxuser");

  }
}
