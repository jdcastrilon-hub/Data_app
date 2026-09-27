import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso.guard';

export const PRESTAMOS_ROUTES: Routes = [
    { path: 'prestamos', loadComponent: () => import('./prestamos.component').then(m => m.PrestamosComponent), title: 'Préstamos' },
    {
        path: 'prestamos/new', loadComponent: () => import('./form-prestamo/form-prestamo.component').then(m => m.FormPrestamoComponent), title: 'Nuevo préstamo',
        canActivate: [permisoGuard], data: { menuCodigo: 'PRE_CONTRATOS', accion: 'CREAR' }
    },
    { path: 'prestamos/view/:id', loadComponent: () => import('./form-prestamo/form-prestamo.component').then(m => m.FormPrestamoComponent), title: 'Préstamo' },
    { path: 'monitorprestamos', loadComponent: () => import('./monitorprestamos/monitorprestamos.component').then(m => m.MonitorprestamosComponent), title: 'Monitor de Préstamos' },
    {
        path: 'confprestamo', loadComponent: () => import('./confprestamo/confprestamo.component').then(m => m.ConfPrestamoComponent), title: 'Configuración de Préstamos',
        canActivate: [permisoGuard], data: { menuCodigo: 'PRE_CONFPREST', accion: 'VER' }
    },
];
