import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Recuperamos el token del localStorage
  const token = localStorage.getItem('token'); 

  // Si el token existe, clonamos la petición y le inyectamos el header Authorization
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  // Si no hay token, la petición continúa su flujo original intacta
  return next(req);
};