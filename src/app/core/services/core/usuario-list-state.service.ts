import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de usuarios, para que al
 * volver desde "ver"/"editar"/"nuevo" (sin importar de donde se venia antes) se
 * restaure el mismo estado. Mismo patron que ProveedorListStateService.
 */
@Injectable({
  providedIn: 'root'
})
export class UsuarioListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 15;
}
