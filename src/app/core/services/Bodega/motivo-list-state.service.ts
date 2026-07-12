import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de motivos de ajuste, para
 * que al volver desde "ver"/"editar"/"nuevo" (sin importar de donde se venia antes)
 * se restaure el mismo estado.
 */
@Injectable({
  providedIn: 'root'
})
export class MotivoListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 10;
}
