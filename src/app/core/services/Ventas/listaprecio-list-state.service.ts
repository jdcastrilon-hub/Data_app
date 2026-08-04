import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de "listas de precio",
 * para que al volver desde "ver"/"editar"/"nuevo" se restaure el mismo estado.
 */
@Injectable({
  providedIn: 'root'
})
export class ListaprecioListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 15;
}
