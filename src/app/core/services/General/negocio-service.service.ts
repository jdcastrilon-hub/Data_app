import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Negocio } from '../../models/General/Negocio';
import { NegocioxCategoriasDTO } from '../../models/General/NegocioxCategoriasDTO';

@Injectable({
  providedIn: 'root'
})
export class NegocioServiceService {
  private url: string = 'http://localhost:8080/api/bodega/negocios/';

  constructor(private http: HttpClient) { }

  list(): Observable<Negocio[]> {
    return this.http.get<Negocio[]>(this.url + "list");
  }

  listNegociosxCategoria(): Observable<NegocioxCategoriasDTO[]> {
    return this.http.get<NegocioxCategoriasDTO[]>(this.url + "listaCategorias");
  }
}
