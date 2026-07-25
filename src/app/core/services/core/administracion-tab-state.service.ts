import { Injectable } from '@angular/core';

/**
 * Recuerda el tab activo de Administracion (Usuarios/Roles/Sucursales/...), para que
 * al volver desde el formulario de cualquiera de sus pestañas se quede en la misma
 * pestaña que lo abrio, en vez de reiniciar siempre en la primera. Mismo patron que
 * las XxxListStateService (persistencia via un servicio singleton, no query params).
 */
@Injectable({
  providedIn: 'root'
})
export class AdministracionTabStateService {
  activeIndex: number = 0;
}
