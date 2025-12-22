import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Bodega } from '../../models/Bodega/Bodega';
import { map, Observable } from 'rxjs';
import { StockDisponible } from '../../models/Bodega/StockDisponible';
import { PageResponse } from '../../models/core/PageResponse';
import { BodegaListView } from '../../interfaces/Bodega/BodegaListView';

interface ApiResponse {
  status: string; // Definición clara como string
  message: string;
  data: Bodega;
}

@Injectable({
  providedIn: 'root'
})
export class BodegaService {

  private url: string = 'http://localhost:8080/api/bodega/bodegas/';

  constructor(private http: HttpClient) { }

  list(): Observable<Bodega[]> {
    //const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqdWFuIiwiaWF0IjoxNzQ5OTI2NDQ3LCJleHAiOjE3NDk5MzAwNDd9.FO-f63ntqva-gAKTHnIFHHJQDgolbZUVABk1ed3XOx0'; // o donde tengas guardado el token
    //const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<Bodega[]>(this.url + "list");
  }

  listPaginacion(page: number, size: number): Observable<PageResponse<BodegaListView>> {
    const params = new HttpParams()
      .set('page', page.toString())//Pagina 
      .set('size', size.toString())//Cantidad de registros a validar

    return this.http.get<PageResponse<BodegaListView>>(this.url + "pagenation", { params });
  }

  //Lista para seleccion de combox
  listSelection(): Observable<BodegaListView[]> {
    //const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqdWFuIiwiaWF0IjoxNzQ5OTI2NDQ3LCJleHAiOjE3NDk5MzAwNDd9.FO-f63ntqva-gAKTHnIFHHJQDgolbZUVABk1ed3XOx0'; // o donde tengas guardado el token
    //const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<BodegaListView[]>(this.url + "selection");
  }

  stockDisponible(idArticulo: number, idBodega: number, idEstado: number): Observable<StockDisponible[]> {
    const params = new HttpParams()
      .set('idArticulo', String(idArticulo))
      .set('idBodega', String(idBodega))
      .set('idEstado', String(idEstado));
    return this.http.get<StockDisponible[]>(this.url + "stockDisponiblexBodega", { params });
  }

  //Guardar Bodega
  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'ok') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar la categoría.');
        }
        return response.data;
      })
    );
  }
}
