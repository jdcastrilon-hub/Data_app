import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ClienteSearch } from '../../interfaces/Comercial/ClienteSearch';

@Injectable({
  providedIn: 'root'
})
export class VentaServiceService {

  private url: string = `${environment.baseUrl}/comercial/ventas/`;

  constructor(private http: HttpClient) { }




}
