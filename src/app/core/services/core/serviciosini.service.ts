import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Numerador } from '../../models/core/Numerador';
import { Observable } from 'rxjs';
import { stkDisponibleCompra } from '../../interfaces/Compras/stkDisponibleCompra';
import { stkDisponibleVenta } from '../../interfaces/Comercial/stkDisponibleVenta';

@Injectable({
  providedIn: 'root'
})
export class ServiciosiniService {

  private url: string = `${environment.baseUrl}/core/services/ini/`;

  constructor(private http: HttpClient) { }

  numeradorNext(numerador: string): Observable<Numerador> {
    const params = new HttpParams()
      .set('numerador', numerador);
    return this.http.get<Numerador>(this.url + "numerador/next", { params });
  }


  stkCompraDisponible(idArticulo: number, idCodBarra: number, idBodega: number, idEstado: number): Observable<stkDisponibleCompra[]> {
    const params = new HttpParams()
      .set('idArticulo', idArticulo)
      .set('idACodBarra', idCodBarra)
      .set('idBodega', idBodega)
      .set('idEstado', idEstado)
      .set('idProveedor', 0);
    return this.http.get<stkDisponibleCompra[]>(this.url + "compraDisponiblexBodega", { params });
  }

  stkVentaDisponible(idArticulo: number, idCodBarra: number, idBodega: number, idEstado: number): Observable<stkDisponibleVenta[]> {
    const params = new HttpParams()
      .set('idArticulo', idArticulo)
      .set('idACodBarra', idCodBarra)
      .set('idBodega', idBodega)
      .set('idEstado', idEstado);
    return this.http.get<stkDisponibleVenta[]>(this.url + "ventaDisponiblexBodega", { params });
  }

}
