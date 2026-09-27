import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PeriodicidadCombo } from '../../interfaces/Prestamos/PeriodicidadCombo';

@Injectable({
  providedIn: 'root'
})
export class PeriodicidadService {

  private url: string = `${environment.baseUrl}/prestamos/periodicidad/`;

  constructor(private http: HttpClient) { }

  // Periodicidades habilitadas para la empresa activa (via Configuracion de
  // Prestamos) - usado por el select del formulario de Prestamo.
  listCombo(): Observable<PeriodicidadCombo[]> {
    return this.http.get<PeriodicidadCombo[]>(this.url + "listCombo");
  }
}
