import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ValidacionAbrirTurno } from '../../interfaces/Comercial/ValidacionAbrirTurno';
import { UltimaCaja } from '../../interfaces/Comercial/UltimaCaja';
import { Turnos } from '../../models/Ventas/Turnos';
import { PageResponse } from '../../models/core/PageResponse';
import { TurnoListView } from '../../interfaces/Comercial/TurnoListView';
import { LoginService } from '../core/login.service';

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

  constructor(private http: HttpClient, private loginService: LoginService) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<TurnoListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('idempresa', String(this.loginService.getIdEmpresaActual()))

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<TurnoListView>>(this.url + "pagination", { params });
  }

  //Obtener turno por el ID
  getTurnoById(id: number): Observable<Turnos> {
    const params = new HttpParams().set('id', id);
    return this.http.get<Turnos>(this.url + "search", { params });
  }

  //Editar turno
  edit(id: number, objecto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "edit/" + id, objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el turno.');
        }
        return response.data;
      })
    );
  }

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
