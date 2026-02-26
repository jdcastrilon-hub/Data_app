import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Unidad } from '../../models/Bodega/Unidad';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UnidadServiceService {
  
  private url: string = `${environment.baseUrl}/bodega/unidades/`;
  constructor(private http: HttpClient) { }

  list(): Observable<Unidad[]> {
    return this.http.get<Unidad[]>(this.url + "list");
  }
}
