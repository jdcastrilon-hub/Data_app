import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PersonaSearch } from '../../interfaces/Compras/PersonaSearch';
import { Persona } from '../../models/Compras/Personas';

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

  //Trae el detalle completo de una persona (para cargar sus datos al seleccionarla)
  getById(idPersona: number): Observable<Persona> {
    const params = new HttpParams().set('id_persona', String(idPersona));
    return this.http.get<Persona>(this.url + "search", { params });
  }
}
