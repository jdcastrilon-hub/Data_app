import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de estados, para que al
 * volver desde "ver"/"editar"/"nuevo" (sin importar de donde se venia antes) se
 * restaure el mismo estado.
 */
@Injectable({
  providedIn: 'root'
})
export class EstadoListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 15;
}
