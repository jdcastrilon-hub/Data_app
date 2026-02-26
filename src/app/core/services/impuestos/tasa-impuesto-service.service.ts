import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TasaImpuesto } from '../../models/Impuestos/TasaImpuesto';
import { TasasCombo } from '../../interfaces/Impuestos/TasasCombo';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TasaImpuestoServiceService {

  private url: string = `${environment.baseUrl}/impuesto/tasas/`;

  constructor(private http: HttpClient) { }

  list(): Observable<TasaImpuesto[]> {
    return this.http.get<TasaImpuesto[]>(this.url + "list");
  }

  ListCombos(): Observable<TasasCombo[]> {
    return this.http.get<TasasCombo[]>(this.url + "listImpuestos");
  }
}
