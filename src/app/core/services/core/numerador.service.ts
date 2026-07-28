import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Numerador } from '../../models/core/Numerador';

@Injectable({
  providedIn: 'root'
})
export class NumeradorService {

  private url: string = `${environment.baseUrl}/core/numeradores/`;

  constructor(private http: HttpClient) { }

  //Previsualiza el siguiente consecutivo de md_numeradores SIN consumirlo.
  //Es tentativo: el numero real se asigna recien al grabar.
  preview(idEmp: number, codigo: string): Observable<Numerador> {
    const params = new HttpParams()
      .set('id_emp', idEmp)
      .set('codigo', codigo);
    return this.http.get<Numerador>(this.url + "preview", { params });
  }
}
