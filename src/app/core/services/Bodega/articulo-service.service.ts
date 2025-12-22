import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Articulo } from '../../models/Bodega/Articulo';
import { Observable } from 'rxjs';
import { ArticuloDTO } from '../../models/Bodega/ArticuloDTO';
import { ArticuloSearch } from '../../models/Bodega/ArticuloSearch';

@Injectable({
  providedIn: 'root'
})
export class ArticuloServiceService {

  private url: string = 'http://localhost:8080/api/bodega/articulo/';

  constructor(private http: HttpClient) { }

  list(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(this.url + "list");
  }

  getEdition(objecto: Articulo): Observable<ArticuloDTO> {
    const params = new HttpParams()
      .set('id', String(objecto.id_articulo));
    console.log("getEdition");
    console.log(objecto.id_articulo);
    return this.http.get<ArticuloDTO>(this.url + "getedition", { params });
  }

  save(objecto: Articulo): Observable<Articulo> {
    return this.http.post<Articulo>(this.url + "save", objecto);
  }

  update(objecto: Articulo): Observable<Articulo> {
    const params = new HttpParams()
      .set('id', String(objecto.id_articulo));
    return this.http.put<Articulo>(this.url + "update", objecto, { params });
  }

  //Servicios adicionales

  Search(query: string): Observable<ArticuloSearch[]> {
    const params = new HttpParams()
      .set('query', String(query));
    return this.http.get<ArticuloSearch[]>(this.url + "Search", { params });
  }

}
