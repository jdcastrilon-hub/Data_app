import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EstadoListView } from '../../interfaces/Bodega/EstadoListView';
import { EstadoCombo } from '../../interfaces/Bodega/EstadoCombo';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EstadosService {

  private url: string = `${environment.baseUrl}/bodega/estados/`;

  constructor(private http: HttpClient) { }

  //Lista para seleccion de combox
  listSelection(): Observable<EstadoCombo[]> {
    //const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqdWFuIiwiaWF0IjoxNzQ5OTI2NDQ3LCJleHAiOjE3NDk5MzAwNDd9.FO-f63ntqva-gAKTHnIFHHJQDgolbZUVABk1ed3XOx0'; // o donde tengas guardado el token
    //const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<EstadoCombo[]>(this.url + "listCombo");
  }

}
