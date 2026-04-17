import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors} from '@angular/common/http'; // <-- Importa estos
import { routes } from './app.routes';
import { errorInterceptor } from './core/services/core/interceptor';
import { provideNativeDateAdapter } from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNativeDateAdapter(), // Esto habilita el soporte de fechas nativas globalmente
    // 1. Habilitamos el cliente HTTP
    // 2. 'withInterceptorsFromDi' permite que Angular busque los interceptores 
    //    definidos con la sintaxis de clases (como el ErrorInterceptor que creamos)
    provideHttpClient(
      withInterceptors([errorInterceptor]) // <--- Así se registra en Angular 19
    )
  ]
}; 