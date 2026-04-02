import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { TipoServicios } from '../../models/Bodega/TipoServicios';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TipoServiciosService {

  private url: string = `${environment.baseUrl}/bodega/tiposervicio/`;

  constructor(private http: HttpClient) { }

  list(): Observable<TipoServicios[]> {
    return this.http.get<TipoServicios[]>(this.url + "list");
  }

}
