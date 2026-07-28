import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Bodega } from '../../models/Bodega/Bodega';
import { map, Observable } from 'rxjs';
import { StockDisponible } from '../../models/Bodega/StockDisponible';
import { PageResponse } from '../../models/core/PageResponse';
import { BodegaListView } from '../../interfaces/Bodega/BodegaListView';
import { environment } from 'src/environments/environment';
import { BodegaCombo } from '../../interfaces/Bodega/BodegaCombo';
import { LoginService } from '../core/login.service';

interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}

@Injectable({
  providedIn: 'root'
})
export class BodegaService {

  private url: string = `${environment.baseUrl}/bodega/bodegas/`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<BodegaListView>> {
    let params = new HttpParams()
      .set('page', page.toString())//Pagina
      .set('size', size.toString())//Cantidad de registros a validar

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<BodegaListView>>(this.url + "pagination", { params });
  }

  //Lista para seleccion de combox
  listSelection(): Observable<BodegaCombo[]> {
    //const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqdWFuIiwiaWF0IjoxNzQ5OTI2NDQ3LCJleHAiOjE3NDk5MzAwNDd9.FO-f63ntqva-gAKTHnIFHHJQDgolbZUVABk1ed3XOx0'; // o donde tengas guardado el token
    //const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<BodegaCombo[]>(this.url + "listCombo");
  }

  stockDisponible(idArticulo: number,idCodBarra: number, idBodega: number, idEstado: number): Observable<StockDisponible[]> {
    console.log(idArticulo)
    console.log(idCodBarra)
    console.log(idBodega)
    console.log(idEstado)
    const params = new HttpParams()
      .set('idArticulo', idArticulo)
      .set('idCodbarra', idCodBarra)
      .set('idBodega', idBodega)
      .set('idEstado', idEstado);
    return this.http.get<StockDisponible[]>(this.url + "stockDisponiblexBodega", { params });
  }

  //Guardar Bodega
  save(objecto: any): Observable<any> {
    const params = new HttpParams().set('id_emp', String(this.loginService.getIdEmpresaActual()));
    return this.http.post<ApiResponse>(this.url + "save", objecto, { params }).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar la categoría.');
        }
        return response.data;
      })
    );
  }

  //Editar Bodega
  edit(objecto: any, id_bodega: number): Observable<any> {
    const params = new HttpParams()
      .set('bodega_id', String(id_bodega))
      .set('id_emp', String(this.loginService.getIdEmpresaActual()))

    return this.http.put<ApiResponse>(this.url + "edit", objecto, { params }).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'success') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar la categoría.');
        }
        return response.data;
      })
    );
  }


  delete(id: number): Observable<void> {
    // Configuramos el query parameter: /delete?bodega_id=ID
    const params = new HttpParams()
      .set('bodega_id', id.toString())
      .set('id_emp', String(this.loginService.getIdEmpresaActual()));

    return this.http.delete<void>(this.url+"delete", { params });
  }


  //Elimninar Bodega

  //Obtener bodega por el ID
  getBodegaById(id: number): Observable<Bodega> {
    const params = new HttpParams()
      .set('bodega_id', id);
    return this.http.get<Bodega>(this.url + "search", { params });
  }


  //No estan en uso
  list(): Observable<Bodega[]> {
    //const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqdWFuIiwiaWF0IjoxNzQ5OTI2NDQ3LCJleHAiOjE3NDk5MzAwNDd9.FO-f63ntqva-gAKTHnIFHHJQDgolbZUVABk1ed3XOx0'; // o donde tengas guardado el token
    //const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<Bodega[]>(this.url + "list");
  }
}
