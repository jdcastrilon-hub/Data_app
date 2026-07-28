import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de medios de pago, para
 * que al volver desde "ver"/"editar"/"nuevo" se restaure el mismo estado.
 */
@Injectable({
  providedIn: 'root'
})
export class MediospagoListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 15;
}
