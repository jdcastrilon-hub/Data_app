import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { PermisosStateService } from '../services/core/permisos-state.service';

/**
 * Bloquea el acceso directo a una ruta (tipeando la URL a mano, no solo
 * escondiendo el boton) cuando el usuario no tiene la accion requerida sobre el
 * formulario. Se configura en la ruta via `data: { menuCodigo, accion }`
 * (codigos de md_menu.codigo y md_permisos.codigo respectivamente).
 *
 * Piloto (2026-07-21): aplicado solo a Bodegas por ahora, no a toda la app -
 * ver project_data_admin_module_design para el porque del alcance acotado.
 */
export const permisoGuard: CanActivateFn = (route) => {
  const permisosState = inject(PermisosStateService);
  const router = inject(Router);

  const menuCodigo = route.data['menuCodigo'] as string;
  const accion = route.data['accion'] as string;

  return permisosState.cargar().pipe(
    map(() => {
      if (permisosState.tienePermiso(menuCodigo, accion)) {
        return true;
      }
      return router.createUrlTree(['/no-autorizado']);
    })
  );
};
