import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TipoDocumento } from '../../models/Compras/TipoDocumento';

@Injectable({
  providedIn: 'root'
})
export class TipoDocumentoService {

  private url: string = 'http://localhost:8080/api/compras/tipodocumento/';

  constructor(private http: HttpClient) { }

  list(): Observable<TipoDocumento[]> {
    return this.http.get<TipoDocumento[]>(this.url + "list");
  }
}
