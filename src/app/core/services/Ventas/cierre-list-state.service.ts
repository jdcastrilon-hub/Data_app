import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de cierres, para que al
 * volver desde "ver" se restaure el mismo estado.
 */
@Injectable({
  providedIn: 'root'
})
export class CierreListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 15;
}
