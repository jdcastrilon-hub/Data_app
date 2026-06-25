import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ValidacionAbrirTurno } from '../../interfaces/Comercial/ValidacionAbrirTurno';

interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}

@Injectable({
  providedIn: 'root'
})
export class AbrirturnoService {

  private url: string = `${environment.baseUrl}/comercial/turnos/`;

  constructor(private http: HttpClient) { }


  ValidacionTurno(usuario: string): Observable<ValidacionAbrirTurno> {
    console.log("Service Search");
    const params = new HttpParams()
      .set('usuario', String(usuario));
    return this.http.get<ValidacionAbrirTurno>(this.url + "validacionturno", { params });
  }
}
