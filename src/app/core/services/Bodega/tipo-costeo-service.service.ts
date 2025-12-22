import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TipoCosteo } from '../../models/Bodega/tipoCosteo';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TipoCosteoServiceService {

  private url: string = 'http://localhost:8080/api/bodega/tipocosteo/';
  constructor(private http: HttpClient) { }

  list(): Observable<TipoCosteo[]> {
    return this.http.get<TipoCosteo[]>(this.url + "list");
  }
}
