import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificacionesService } from '../notificaciones.service';
import { LoginService } from '../login.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // Inyectamos el servicio de notificaciones de forma moderna
  const notificacion = inject(NotificacionesService);
  const loginService = inject(LoginService);
  const router = inject(Router);
  console.log('--- INTERCEPTOR EJECUTÁNDOSE ---');
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Token inexistente/expirado/inválido: el backend siempre responde 401 en ese caso.
      // Cerramos la sesión local y mandamos al login en vez de mostrar el error genérico.
      if (err.status === 401) {
        loginService.logout();
        router.navigate(['/login']);
        notificacion.showError('Tu sesión expiró, por favor inicia sesión nuevamente');
        return throwError(() => err);
      }

      // El backend responde en dos formatos distintos según el tipo de error:
      // - {status, message, data}: errores capturados por los handlers globales (exception_handlers.py)
      // - {detail}: HTTPException "crudas" lanzadas directamente en los controllers (el caso más común),
      //   donde "detail" puede ser un string o, en errores de validación (422) automáticos de FastAPI,
      //   una lista de objetos {loc, msg, type}
      const errorBackend = err.error;
      console.log(errorBackend)
      let mensajeMostrar = 'Error inesperado en el servidor';

      if (errorBackend && errorBackend.message) {
        mensajeMostrar = errorBackend.message;

        // Log para desarrollo si es error de validación (422)
        if (err.status === 422) {
          console.error('Detalles de validación:', errorBackend.data);
        }
      } else if (typeof errorBackend?.detail === 'string') {
        mensajeMostrar = errorBackend.detail;
      } else if (Array.isArray(errorBackend?.detail) && errorBackend.detail.length) {
        mensajeMostrar = errorBackend.detail.map((d: any) => d.msg).join(', ');
      } else if (err.status === 0) {
        mensajeMostrar = 'No hay comunicación con el servidor';
      }

      // Mostramos la notificación automáticamente
      notificacion.showError(mensajeMostrar);

      // Importante: Retornamos el error para que el componente sepa que falló
      return throwError(() => err);
    })
  );
};