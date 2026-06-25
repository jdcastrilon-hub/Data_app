import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificacionesService } from '../notificaciones.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // Inyectamos el servicio de notificaciones de forma moderna
  const notificacion = inject(NotificacionesService);
  console.log('--- INTERCEPTOR EJECUTÁNDOSE ---');
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Accedemos a la estructura {status, message, data} que viene de FastAPI
      const errorBackend = err.error;
      console.log(errorBackend)
      let mensajeMostrar = 'Error inesperado en el servidor';

      if (errorBackend && errorBackend.message) {
        mensajeMostrar = errorBackend.message;

        // Log para desarrollo si es error de validación (422)
        if (err.status === 422) {
          console.error('Detalles de validación:', errorBackend.data);
        }
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