import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Numerador } from '../../models/core/Numerador';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiciosiniService {

  private url: string = `${environment.baseUrl}/core/services/ini/`;

  constructor(private http: HttpClient) { }

  numeradorNext(numerador: string): Observable<Numerador> {
    const params = new HttpParams()
      .set('numerador', numerador);
    return this.http.get<Numerador>(this.url + "numerador/next", { params });
  }

}
