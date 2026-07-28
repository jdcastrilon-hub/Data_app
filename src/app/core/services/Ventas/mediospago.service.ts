import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MediosPago } from '../../models/Ventas/MediosPago';
import { PageResponse } from '../../models/core/PageResponse';
import { MediospagoListView } from '../../interfaces/Comercial/MediospagoListView';
import { LoginService } from '../core/login.service';
import { MedioPago } from '../../models/Ventas/medioPago';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class MediospagoService {

  private url: string = `${environment.baseUrl}/comercial/mediopago/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  //Combo simple (id, tipo), sin paginar - usado por los selects de "Forma de Pago".
  list(): Observable<MedioPago[]> {
    return this.http.get<MedioPago[]>(this.url + "list");
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<MediospagoListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('idempresa', String(this.loginService.getIdEmpresaActual()))

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<MediospagoListView>>(this.url + "pagination", { params });
  }

  //Obtener medio de pago por el ID
  getMedioPagoById(id: number): Observable<MediosPago> {
    const params = new HttpParams().set('id', id);
    return this.http.get<MediosPago>(this.url + "search", { params });
  }

  //Guardar medio de pago
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el medio de pago.');
        }
        return response.data;
      })
    );
  }

  //Editar medio de pago
  edit(id: number, objecto: any): Observable<any> {
    return this.http.put<ApiResponse>(this.url + "edit/" + id, objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el medio de pago.');
        }
        return response.data;
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url + "delete/" + id);
  }
}
