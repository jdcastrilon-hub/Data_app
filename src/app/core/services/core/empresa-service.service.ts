import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { Empresas } from '../../models/core/Empresas';
import { Numerador } from '../../models/core/Numerador';

@Injectable({
  providedIn: 'root'
})
export class EmpresaServiceService {

  private url: string = 'http://localhost:8080/api/core/empresa/';

  constructor(private http: HttpClient) { }

  list(): Observable<Empresas[]> {
    return this.http.get<Empresas[]>(this.url + "list");
  }

  numeradorNext(numerador: string): Observable<Numerador> {
     const params = new HttpParams()
      .set('numerador', numerador);
    return this.http.get<Numerador>(this.url + "numeradornext", { params });
  }

}
