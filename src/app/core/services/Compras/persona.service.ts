import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PersonaSearch } from '../../interfaces/Compras/PersonaSearch';

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
}
