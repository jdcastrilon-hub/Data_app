import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Categoria } from '../../models/Bodega/Categoria';
import { Subject, Observable } from 'rxjs';
import { PageResponse } from '../../models/core/PageResponse';
import { CategoriaListView } from '../../models/Bodega/CategoriaListView';
import { CategoriaCombo } from '../../interfaces/Bodega/CategoriaCombo';
import { SubcategoriaCombo } from '../../interfaces/Bodega/SubcategoriaCombo';
import { environment } from 'src/environments/environment';

interface ApiResponse<T = void> {
  status: 'success' | 'error'; // Uso de literales para mejor tipado
  message: string;
  data?: T; // La T es genérica y el ? la hace opcional
}

@Injectable({
  providedIn: 'root'
})

export class CategoriaService {

  private url: string = `${environment.baseUrl}/bodega/categorias/`;

  // Subject: El canal que usaremos para emitir la nueva categoría.
  private EventoCategoria = new Subject<any>();

  // Observable: Lo que la vista de lista se suscribirá para recibir datos.
  nuevaCategoria$ = this.EventoCategoria.asObservable();


  constructor(private http: HttpClient) { }

  // Combo de categorias activas (usado por Utilidad x Categoria).
  listSelection(): Observable<CategoriaCombo[]> {
    return this.http.get<CategoriaCombo[]>(this.url + "listCombo");
  }

  // Combo de subcategorias de una categoria puntual (cascada del anterior).
  listSubcategorias(idCategoria: number): Observable<SubcategoriaCombo[]> {
    return this.http.get<SubcategoriaCombo[]>(this.url + idCategoria + "/subcategorias/listCombo");
  }

  listPaginacion(page: number, size: number, texto?: string): Observable<PageResponse<CategoriaListView>> {
    let params = new HttpParams()
      .set('page', page.toString())//Pagina
      .set('size', size.toString())//Cantidad de registros a validar
    //.set('sort','fechaMod,desc');//Ordenamiento de la lista

    if (texto) {
      params = params.set('texto', texto);
    }

    return this.http.get<PageResponse<CategoriaListView>>(this.url + "pagination", { params });
  }

  save(objecto: any): Observable<any> {
    return this.http.post<ApiResponse>(this.url + "save", objecto);
  }

  update(objecto: Categoria): Observable<any> {
     return this.http.put<ApiResponse>(this.url + "edit/" + objecto.id, objecto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url + "delete/" + id);
  }

  getCategoriaById(id: number): Observable<Categoria> {
    const params = new HttpParams()
      .set('categoria_id', id);
    return this.http.get<Categoria>(this.url + "search", { params });
  }
}