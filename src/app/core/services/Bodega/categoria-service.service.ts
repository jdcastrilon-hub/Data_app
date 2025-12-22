import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Categoria } from '../../models/Bodega/Categoria';
import { Subject, Observable, tap, map } from 'rxjs';
import { PageResponse } from '../../models/core/PageResponse';
import { CategoriaListView } from '../../models/Bodega/CategoriaListView';

interface ApiResponse {
  status: string; // Definición clara como string
  message: string;
  data: Categoria;
}

@Injectable({
  providedIn: 'root'
})

export class CategoriaService {


  private url: string = 'http://localhost:8080/api/bodega/categoria/';

  // Subject: El canal que usaremos para emitir la nueva categoría.
  private EventoCategoria = new Subject<any>();

  // Observable: Lo que la vista de lista se suscribirá para recibir datos.
  nuevaCategoria$ = this.EventoCategoria.asObservable();


  constructor(private http: HttpClient) { }

  list(): Observable<Categoria[]> {
    //const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqdWFuIiwiaWF0IjoxNzQ5OTI2NDQ3LCJleHAiOjE3NDk5MzAwNDd9.FO-f63ntqva-gAKTHnIFHHJQDgolbZUVABk1ed3XOx0'; // o donde tengas guardado el token
    //const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<Categoria[]>(this.url + "list");
  }

  listxEmpresa(codEmp: string): Observable<Categoria[]> {
    //const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqdWFuIiwiaWF0IjoxNzQ5OTI2NDQ3LCJleHAiOjE3NDk5MzAwNDd9.FO-f63ntqva-gAKTHnIFHHJQDgolbZUVABk1ed3XOx0'; // o donde tengas guardado el token
    //const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const params = new HttpParams()
      .set('codEmp', String(codEmp));
    return this.http.get<Categoria[]>(this.url + "listxEmpresa", { params });
  }

  listPaginacion(page: number, size: number): Observable<PageResponse<CategoriaListView>> {
    const params = new HttpParams()
      .set('page', page.toString())//Pagina 
      .set('size', size.toString())//Cantidad de registros a validar
    //.set('sort','fechaMod,desc');//Ordenamiento de la lista

    return this.http.get<PageResponse<CategoriaListView>>(this.url + "pagenation", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto).pipe(
      map((response: ApiResponse) => {

        if (response.status !== 'ok') {
          // Si el estado no es 'ok', lanzamos un error para que lo maneje el 'subscribe'
          throw new Error(response.message || 'Error desconocido al guardar la categoría.');
        }
        //Extraer data de la respuesta.
        const categoriaGuardada = response.data;

        // Emitir el objeto extraído (el "json" que se creó)
        this.EventoCategoria.next(categoriaGuardada);

        return categoriaGuardada;
      })
    );
  }

  update(objecto: Categoria): Observable<Categoria> {
    const params = new HttpParams()
      .set('id', String(objecto.id));
    return this.http.put<Categoria>(this.url + "update", objecto, { params });
  }

  delete(idCategoria: number): Observable<void> {
    const params = new HttpParams()
      .set('id', idCategoria);

    console.log(this.url + "delete");
    return this.http.delete<void>(this.url + "delete", { params });
  }

  getCategoriaById(id: number): Observable<Categoria> {
    const params = new HttpParams()
      .set('id', id);
    return this.http.get<Categoria>(this.url + "getCategoriaById", { params });
  }

  buscarArticuloLike(valor: string): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.url + "buscar?valor=" + valor);
  }
}