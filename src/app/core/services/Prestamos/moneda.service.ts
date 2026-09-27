import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MonedaCombo } from '../../interfaces/Prestamos/MonedaCombo';

@Injectable({
  providedIn: 'root'
})
export class MonedaService {

  private url: string = `${environment.baseUrl}/prestamos/moneda/`;

  constructor(private http: HttpClient) { }

  // Monedas activas de la empresa activa - usado por el select del
  // formulario de Prestamo (se autoselecciona si solo hay 1).
  listCombo(): Observable<MonedaCombo[]> {
    return this.http.get<MonedaCombo[]>(this.url + "listCombo");
  }
}
