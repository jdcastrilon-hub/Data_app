import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TasaImpuesto } from '../../models/Impuestos/TasaImpuesto';

@Injectable({
  providedIn: 'root'
})
export class TasaImpuestoServiceService {
  private url: string = 'http://localhost:8080/api/impuesto/tasas/';

  constructor(private http: HttpClient) { }

  list(): Observable<TasaImpuesto[]> {
    return this.http.get<TasaImpuesto[]>(this.url + "list");
  }
}
