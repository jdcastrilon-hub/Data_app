import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ResumenCierre } from '../../interfaces/Comercial/ResumenCierre';
import { CierreListView } from '../../interfaces/Comercial/CierreListView';
import { DetalleConceptoLinea } from '../../interfaces/Comercial/DetalleConceptoLinea';
import { CierreTurno } from '../../models/Ventas/CierreTurno';
import { PageResponse } from '../../models/core/PageResponse';
import { LoginService } from '../core/login.service';

interface ApiResponse<T = void> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class CierreTurnoService {

  private url: string = `${environment.baseUrl}/comercial/cierreturno/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<CierreListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('idempresa', String(this.loginService.getIdEmpresaActual()));

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<CierreListView>>(this.url + 'pagination', { params });
  }

  // Agrupado de td_abrirturno para el turno - alimenta la grilla del formulario
  // de cierre antes de guardar (no persiste nada).
  resumen(idTurno: number): Observable<ResumenCierre> {
    const params = new HttpParams().set('idTurno', idTurno);
    return this.http.get<ResumenCierre>(this.url + 'resumen', { params });
  }

  // Nivel 2 del drill-down: facturas individuales detras de una fila agrupada
  // (mismo concepto/medio de pago/signo) de la grilla del cierre.
  detalleConcepto(idTurno: number, concepto: string, idMediopago: number, signo: number): Observable<DetalleConceptoLinea[]> {
    const params = new HttpParams()
      .set('idTurno', idTurno)
      .set('concepto', concepto)
      .set('idMediopago', idMediopago)
      .set('signo', signo);
    return this.http.get<DetalleConceptoLinea[]>(this.url + 'detalleconcepto', { params });
  }

  getCierreById(id: number): Observable<CierreTurno> {
    const params = new HttpParams().set('id', id);
    return this.http.get<CierreTurno>(this.url + 'search', { params });
  }

  save(objeto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + 'save', objeto).pipe(
      map((response: ApiResponse) => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al cerrar el turno.');
        }
        return response.data;
      })
    );
  }
}
