import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MotivosAjuste } from '../../models/Bodega/MotivosAjuste';
import { map, Observable } from 'rxjs';
import { MotivoAjusteView } from '../../models/Bodega/MotivoAjusteView';
import { PageResponse } from '../../models/core/PageResponse';

interface ApiResponse {
  status: string; // Definición clara como string
  message: string;
  data: MotivosAjuste;
}

@Injectable({
  providedIn: 'root'
})
export class MotivosAjusteService {

  private url: string = 'http://localhost:8080/api/bodega/motivos/';

  constructor(private http: HttpClient) { }

  list(): Observable<MotivosAjuste[]> {
    return this.http.get<MotivosAjuste[]>(this.url + "list");
  }

  listPaginacion(page: number, size: number): Observable<PageResponse<MotivoAjusteView>> {
    const params = new HttpParams()
      .set('page', page.toString())//Pagina 
      .set('size', size.toString())//Cantidad de registros a validar
    //.set('sort','fechaMod,desc');//Ordenamiento de la lista

    return this.http.get<PageResponse<MotivoAjusteView>>(this.url + "pagenation", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'ok') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar la categoría.');
        }
        //Extraer data de la respuesta.
        const objectoApi = response.data;

        // Emitir el objeto extraído (el "json" que se creó)
        //this.EventoCategoria.next(objectoApi);

        return objectoApi;
      })
    );
  }
}
