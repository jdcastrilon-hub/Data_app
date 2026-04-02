import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Negocio } from '../../models/General/Negocio';
import { NegocioxCategoriasDTO } from '../../models/General/NegocioxCategoriasDTO';
import { environment } from 'src/environments/environment';
import { EmpresaByNegocioCategorias } from '../../interfaces/Core/EmpresaByNegocioCategorias';

@Injectable({
  providedIn: 'root'
})
export class NegocioServiceService {
  
  private url: string = `${environment.baseUrl}/core/negocios/`;

  constructor(private http: HttpClient) { }

  list(): Observable<Negocio[]> {
    return this.http.get<Negocio[]>(this.url + "list");
  }

  listNegociosxCategoria(): Observable<EmpresaByNegocioCategorias> {
    const params = new HttpParams()
      .set('id_empresa', String(1))
    return this.http.get<EmpresaByNegocioCategorias>(this.url + "listByNegocios",{params});
  }
}
