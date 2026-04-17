import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MonitorStockFiltroInventario } from '../../interfaces/Bodega/MonitorStockFiltroInventario';
import { MonitorStockVista1 } from '../../interfaces/Bodega/MonitorStockVista1';

@Injectable({
  providedIn: 'root'
})
export class MonitorstockService {

  private url: string = `${environment.baseUrl}/bodega/monitor/`;

  constructor(private http: HttpClient) { }

  filtrosvistainventrio(): Observable<MonitorStockFiltroInventario> {
    const params = new HttpParams()
      .set('id_empresa', String(1))
    return this.http.get<MonitorStockFiltroInventario>(this.url + "filtrovista1", { params });
  }



  monitorinventario(tipoReporte: string, page: number, size: number, filtros: any): Observable<MonitorStockVista1> {
    let params = new HttpParams();
    console.log("API")
    console.log(filtros);

    if (filtros.bodega) {
      const valorBodega = filtros.bodega === 'TODOS' ? 0 : filtros.bodega;
      params = params.set('bodega', valorBodega.toString());
    }

    if (filtros.negocio) {
      const valornegocio = filtros.negocio === 'TODOS' ? 0 : filtros.negocio;
      params = params.set('negocio', valornegocio.toString());
    }

    if (filtros.categoria) {
      const valorcategoria = filtros.categoria === 'TODOS' ? 0 : filtros.categoria;
      params = params.set('categoria', valorcategoria.toString());
    }

    if (filtros.subcategoria) {
      const valorsubcategoria = filtros.subcategoria === 'TODOS' ? 0 : filtros.subcategoria;
      params = params.set('subcategoria', valorsubcategoria.toString());
    }


    params = params.set('page', page);
    params = params.set('size', size);

    console.log("parametros")
    console.log(params.get('fechainicial'));
    return this.http.get<MonitorStockVista1>(this.url + "inventario", { params });
  }
}
