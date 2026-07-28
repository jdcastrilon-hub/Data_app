import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TipoDocumento } from '../../models/Compras/TipoDocumento';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TipoDocumentoService {

  private url: string = `${environment.baseUrl}/compras/tipodoc/`;

  constructor(private http: HttpClient) { }

  list(): Observable<TipoDocumento[]> {
    return this.http.get<TipoDocumento[]>(this.url + "list");
  }

  listSelection(): Observable<TipoDocumento[]> {
    return this.http.get<TipoDocumento[]>(this.url + "listCombo");
  }
}
