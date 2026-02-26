import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TipoCosteo } from '../../models/Bodega/TipoCosteo';

@Injectable({
  providedIn: 'root'
})
export class TipoCosteoServiceService {

  private url: string = `${environment.baseUrl}/bodega/tipocosteo/`;
  constructor(private http: HttpClient) { }

  list(): Observable<TipoCosteo[]> {
    return this.http.get<TipoCosteo[]>(this.url + "list");
  }
}
