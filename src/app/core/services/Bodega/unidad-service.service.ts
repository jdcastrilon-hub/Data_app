import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Unidad } from '../../models/Bodega/Unidad';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnidadServiceService {
  
  private url: string = 'http://localhost:8080/api/bodega/unidades/';
  constructor(private http: HttpClient) { }

  list(): Observable<Unidad[]> {
    return this.http.get<Unidad[]>(this.url + "list");
  }
}
