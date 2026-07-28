import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de cargas masivas de
 * inventario, para que al volver desde "ver"/"nuevo" se restaure el mismo estado.
 */
@Injectable({
  providedIn: 'root'
})
export class CargastockListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 10;
}
