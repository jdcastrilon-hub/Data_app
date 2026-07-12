import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de articulos, para que al
 * volver desde "ver"/"editar"/"nuevo" (sin importar de donde se venia antes) se
 * restaure el mismo estado. Usar el historial del navegador (Location.back()) no
 * sirve aqui porque el usuario puede llegar a /articulos/new desde cualquier otra
 * pantalla, no necesariamente desde la lista.
 */
@Injectable({
  providedIn: 'root'
})
export class ArticuloListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 15;
}
