import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CargaPrecios } from '../../models/Ventas/CargaPrecios';
import { CargaPreciosListView } from '../../interfaces/Comercial/CargaPreciosListView';
import { ResultadoCargaPrecios } from '../../interfaces/Comercial/CargaPreciosResultado';
import { PageResponse } from '../../models/core/PageResponse';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CargapreciosService {

  private url: string = `${environment.baseUrl}/comercial/cargaprecios/`;

  constructor(private http: HttpClient) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<CargaPreciosListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<CargaPreciosListView>>(this.url + "pagination", { params });
  }

  getCargaById(id: number): Observable<CargaPrecios> {
    const params = new HttpParams().set('id_trans', id);
    return this.http.get<CargaPrecios>(this.url + "search", { params });
  }

  descargarPlantilla(): Observable<Blob> {
    return this.http.get(this.url + "plantilla", { responseType: 'blob' });
  }

  // Valida (confirmar=false) o valida+graba (confirmar=true) el archivo cargado.
  procesar(archivo: File, cabezal: {
    idLista: number, fechaCarga: string, observacion?: string
  }, confirmar: boolean): Observable<ResultadoCargaPrecios> {
    const formData = new FormData();
    formData.append('idLista', String(cabezal.idLista));
    formData.append('fechaCarga', cabezal.fechaCarga);
    formData.append('observacion', cabezal.observacion || '');
    formData.append('confirmar', String(confirmar));
    formData.append('archivo', archivo);

    return this.http.post<ResultadoCargaPrecios>(this.url + "procesar", formData);
  }

  // No hay delete() a proposito: esta carga impacta p_precios y puede haber
  // cascadeado reglas de categoria (ver nota en repository_cargaprecios.py).

}
