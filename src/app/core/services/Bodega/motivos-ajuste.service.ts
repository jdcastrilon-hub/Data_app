import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MotivosAjuste } from '../../models/Bodega/MotivosAjuste';
import { map, Observable } from 'rxjs';
import { MotivoAjusteView } from '../../models/Bodega/MotivoAjusteView';
import { PageResponse } from '../../models/core/PageResponse';
import { environment } from 'src/environments/environment';
import { MotivosCombo } from '../../interfaces/Bodega/MotivoCombo';
import { LoginService } from '../core/login.service';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class MotivosAjusteService {

  private url: string = `${environment.baseUrl}/bodega/motivos/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  listSelection(): Observable<MotivosCombo[]> {
    return this.http.get<MotivosCombo[]>(this.url + "listCombo");
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<MotivoAjusteView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<MotivoAjusteView>>(this.url + "pagination", { params });
  }

  getMotivoById(id: number): Observable<MotivosAjuste> {
    const params = new HttpParams().set('id_motivo', id);
    return this.http.get<MotivosAjuste>(this.url + "search", { params });
  }

  //Guardar Motivo
  save(objecto: any): Observable<any> {
    const params = new HttpParams().set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.post<ApiResponse>(this.url + "save", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el motivo.');
        }
        return response.data;
      })
    );
  }

  //Editar Motivo
  edit(objecto: any, id_motivo: number): Observable<any> {
    const params = new HttpParams()
      .set('id_motivo', String(id_motivo))
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el motivo.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams()
      .set('id_motivo', id.toString())
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.delete<void>(this.url + "delete", { params });
  }
}
