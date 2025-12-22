import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Sucursal } from '../../models/General/Sucursal';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SucursalServiceService {

  private url: string = 'http://localhost:8080/api/core/sucursal/';

  constructor(private http: HttpClient) { }

  list(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.url + "list");
  }
}
