import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private url: string = `${environment.baseUrl}/auth/empresas/`;

  constructor(private http: HttpClient) { }

}
