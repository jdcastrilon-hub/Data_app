import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de sucursales, mismo patron
 * que RolListStateService/UsuarioListStateService.
 */
@Injectable({
  providedIn: 'root'
})
export class SucursalListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 15;
}
