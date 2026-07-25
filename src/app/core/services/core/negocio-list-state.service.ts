import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de negocios, mismo patron
 * que SucursalListStateService/RolListStateService.
 */
@Injectable({
  providedIn: 'root'
})
export class NegocioListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 15;
}
