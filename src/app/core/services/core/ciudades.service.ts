import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CiudadCombo } from '../../interfaces/Core/CiudadCombo';

@Injectable({
  providedIn: 'root'
})
export class CiudadesService {

  private url: string = `${environment.baseUrl}/core/ciudad/`;

  constructor(private http: HttpClient) { }

  //List Ciudades
  listSelection(): Observable<CiudadCombo[]> {
    return this.http.get<CiudadCombo[]>(this.url + "listCombo");
  }
}
