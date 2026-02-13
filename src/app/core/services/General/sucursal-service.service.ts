import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Sucursal } from '../../models/General/Sucursal';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SucursalServiceService {

  private url: string = `${environment.baseUrl}/core/sucursal/`;

  constructor(private http: HttpClient) { }

  list(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.url + "list");
  }

  listCombo(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.url + "combo");
  }

  sucursalesxBodegas(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.url + "sucursalesxBodega");
  }

}
