import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CargaStock } from '../../models/Bodega/CargaStock';
import { CargaStockListView } from '../../interfaces/Bodega/CargaStockListView';
import { ResultadoCargaStock } from '../../interfaces/Bodega/CargaStockResultado';
import { PageResponse } from '../../models/core/PageResponse';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CargastockService {

  private url: string = `${environment.baseUrl}/bodega/cargastock/`;

  constructor(private http: HttpClient) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<CargaStockListView>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<CargaStockListView>>(this.url + "pagination", { params });
  }

  getCargaById(id: number): Observable<CargaStock> {
    const params = new HttpParams().set('id_trans', id);
    return this.http.get<CargaStock>(this.url + "search", { params });
  }

  descargarPlantilla(): Observable<Blob> {
    return this.http.get(this.url + "plantilla", { responseType: 'blob' });
  }

  // Valida (confirmar=false) o valida+graba (confirmar=true) el archivo cargado.
  procesar(archivo: File, cabezal: {
    idBodega: number, idEstado: number, idNegocio: number,
    fechaMovimiento: string, observacion?: string
  }, confirmar: boolean): Observable<ResultadoCargaStock> {
    const formData = new FormData();
    formData.append('idBodega', String(cabezal.idBodega));
    formData.append('idEstado', String(cabezal.idEstado));
    formData.append('idNegocio', String(cabezal.idNegocio));
    formData.append('fechaMovimiento', cabezal.fechaMovimiento);
    formData.append('observacion', cabezal.observacion || '');
    formData.append('confirmar', String(confirmar));
    formData.append('archivo', archivo);

    return this.http.post<ResultadoCargaStock>(this.url + "procesar", formData);
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('id_trans', id.toString());
    return this.http.delete<void>(this.url + "delete", { params });
  }

}
