import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FormulaPrestamoCombo } from '../../interfaces/Prestamos/FormulaPrestamoCombo';

@Injectable({
  providedIn: 'root'
})
export class FormulaprestamoService {

  private url: string = `${environment.baseUrl}/prestamos/formulaprestamo/`;

  constructor(private http: HttpClient) { }

  // Formulas habilitadas para la empresa activa (via Configuracion de
  // Prestamos) - usado por el select del formulario de Prestamo.
  listCombo(): Observable<FormulaPrestamoCombo[]> {
    return this.http.get<FormulaPrestamoCombo[]>(this.url + "listCombo");
  }
}
