import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DocumentoVenta } from '../../models/Ventas/DocumentoVenta';
import { PageResponse } from '../../models/core/PageResponse';
import { DocumentoVentaListView } from '../../interfaces/Comercial/DocumentoVentaListView';
import { LoginService } from '../core/login.service';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentosVentaService {

  private url: string = `${environment.baseUrl}/comercial/documentos/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<DocumentoVentaListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('idempresa', String(this.loginService.getIdEmpresaActual()))

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<DocumentoVentaListView>>(this.url + "pagination", { params });
  }

  //Obtener documento de venta por su llave compuesta (idEmp viene de la sesion)
  getDocumentoById(idSucursal: number, documento: string): Observable<DocumentoVenta> {
    const params = new HttpParams()
      .set('id_emp', String(this.loginService.getIdEmpresaActual()))
      .set('id_sucursal_emp', idSucursal)
      .set('documento', documento);
    return this.http.get<DocumentoVenta>(this.url + "search", { params });
  }

  //Guardar documento de venta
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al guardar el documento.');
        }
        return response.data;
      })
    );
  }

  //Editar documento de venta. idSucursalOriginal/documentoOriginal identifican la
  //fila (llave compuesta antes de la edicion); objecto trae los valores nuevos.
  edit(idSucursalOriginal: number, documentoOriginal: string, objecto: any): Observable<any> {
    const params = new HttpParams()
      .set('id_emp', String(this.loginService.getIdEmpresaActual()))
      .set('id_sucursal_emp', idSucursalOriginal)
      .set('documento', documentoOriginal);
    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al editar el documento.');
        }
        return response.data;
      })
    );
  }

  delete(idSucursal: number, documento: string): Observable<void> {
    const params = new HttpParams()
      .set('id_emp', String(this.loginService.getIdEmpresaActual()))
      .set('id_sucursal_emp', idSucursal)
      .set('documento', documento);
    return this.http.delete<void>(this.url + "delete", { params });
  }
}
