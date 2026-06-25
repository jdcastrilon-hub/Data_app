import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ValidacionAbrirTurno } from '../../interfaces/Comercial/ValidacionAbrirTurno';
import { UltimaCaja } from '../../interfaces/Comercial/UltimaCaja';

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

  //Guardar turno
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar cliente.');
        }
        return response.data;
      })
    );
  }


  ValidacionTurno(usuario: string): Observable<ValidacionAbrirTurno> {
    console.log("Service Search");
    const params = new HttpParams()
      .set('usuario', String(usuario));
    return this.http.get<ValidacionAbrirTurno>(this.url + "validacionturno", { params });
  }

  cargarUltimaCaja(usuario: string): Observable<UltimaCaja> {
    console.log("Service Search");
    const params = new HttpParams()
      .set('usuario', String(usuario));
    return this.http.get<UltimaCaja>(this.url + "ultimacajaxuser", { params });
  }

}
