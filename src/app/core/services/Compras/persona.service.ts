import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PersonaSearch } from '../../interfaces/Compras/PersonaSearch';
import { PersonaPaginacion } from '../../interfaces/Compras/PersonaPaginacion';
import { Persona } from '../../models/Compras/Personas';
import { PageResponse } from '../../models/core/PageResponse';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {

  private url: string = `${environment.baseUrl}/compras/personas/`;

  constructor(private http: HttpClient) { }

    PersonaSearch(query: string): Observable<PersonaSearch[]> {
    console.log("Service Search");
    const params = new HttpParams()
      .set('query', String(query));
    return this.http.get<PersonaSearch[]>(this.url + "personaSearch", { params });
  }

  // Listado para el modal "Seleccionar persona" (Proveedores/Clientes): top de
  // la empresa activa, filtrable por documento o nombre.
  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<PersonaPaginacion>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<PersonaPaginacion>>(this.url + "pagination", { params });
  }

  //Trae el detalle completo de una persona (para cargar sus datos al seleccionarla)
  getById(idPersona: number): Observable<Persona> {
    const params = new HttpParams().set('id_persona', String(idPersona));
    return this.http.get<Persona>(this.url + "search", { params });
  }
}
