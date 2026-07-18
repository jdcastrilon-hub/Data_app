import { Injectable } from '@angular/core';

/**
 * Recuerda el filtro/pagina en la que se quedo la lista de documentos de venta,
 * para que al volver desde "ver"/"editar"/"nuevo" se restaure el mismo estado.
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentosVentaListStateService {
  texto: string = '';
  page: number = 0;
  size: number = 15;
}
