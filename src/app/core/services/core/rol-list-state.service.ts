import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de roles, mismo patron
 * que UsuarioListStateService/ProveedorListStateService.
 */
@Injectable({
  providedIn: 'root'
})
export class RolListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 15;
}
