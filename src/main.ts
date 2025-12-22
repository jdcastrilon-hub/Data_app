import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes'; // Importa las rutas definidas en app.routes.ts
import { provideHttpClient } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // ✅ Configurar el enrutador correctamente
    provideHttpClient(),    
    provideNativeDateAdapter()
  ]
}).catch(err => console.error(err));