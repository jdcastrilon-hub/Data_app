import { Injectable } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { MisPermisos } from '../../interfaces/Core/MisPermisos';
import { PermisosService } from './permisos.service';

/**
 * Cachea los permisos del usuario (todas las acciones, no solo Ver) para la
 * empresa activa, para que el guard de rutas no tenga que consultar al backend
 * en cada navegacion. Se trae una sola vez y queda en memoria hasta que se
 * invalide (logout o cambio de empresa).
 */
@Injectable({
  providedIn: 'root'
})
export class PermisosStateService {

  private permisos: MisPermisos | null = null;
  private cargaEnCurso$: Observable<MisPermisos> | null = null;

  constructor(private service: PermisosService) { }

  // Devuelve los permisos ya cacheados, o los trae del backend si es la primera
  // vez (o si se invalidaron). Varias llamadas concurrentes comparten el mismo
  // pedido HTTP en vez de disparar uno por cada una (shareReplay).
  cargar(): Observable<MisPermisos> {
    if (this.permisos) {
      return of(this.permisos);
    }
    if (!this.cargaEnCurso$) {
      this.cargaEnCurso$ = this.service.misPermisos().pipe(
        tap(data => {
          this.permisos = data;
          this.cargaEnCurso$ = null;
        }),
        shareReplay(1)
      );
    }
    return this.cargaEnCurso$;
  }

  // Chequeo sincrono contra el cache (asume que cargar() ya se resolvio).
  tienePermiso(codigoMenu: string, accion: string): boolean {
    return !!this.permisos?.[codigoMenu]?.includes(accion);
  }

  // Invalida el cache (logout o cambio de empresa) para que el proximo cargar()
  // vuelva a consultar al backend.
  invalidar(): void {
    this.permisos = null;
    this.cargaEnCurso$ = null;
  }

}
