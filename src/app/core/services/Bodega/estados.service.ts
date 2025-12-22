import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EstadoStock } from '../../models/Bodega/EstadoStock';
import { EstadoListView } from '../../interfaces/Bodega/EstadoListView';

@Injectable({
  providedIn: 'root'
})
export class EstadosService {

  private url: string = 'http://localhost:8080/api/bodega/estados/';

  constructor(private http: HttpClient) { }

  list(): Observable<EstadoStock[]> {
    return this.http.get<EstadoStock[]>(this.url + "list");
  }

  //Lista para seleccion de combox
  listSelection(): Observable<EstadoListView[]> {
    //const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqdWFuIiwiaWF0IjoxNzQ5OTI2NDQ3LCJleHAiOjE3NDk5MzAwNDd9.FO-f63ntqva-gAKTHnIFHHJQDgolbZUVABk1ed3XOx0'; // o donde tengas guardado el token
    //const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<EstadoListView[]>(this.url + "selection");
  }

}
