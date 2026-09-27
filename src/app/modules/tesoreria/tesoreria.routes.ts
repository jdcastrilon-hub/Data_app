import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso.guard';

export const TESORERIA_ROUTES: Routes = [
    { path: 'conceptos', loadComponent: () => import('./conceptos/conceptos.component').then(m => m.ConceptosComponent), title: 'Conceptos' },
    { path: 'conceptos/new', loadComponent: () => import('./conceptos/form-concepto/form-concepto.component').then(m => m.FormConceptoComponent), title: 'Nuevo concepto' },
    { path: 'conceptos/view/:id', loadComponent: () => import('./conceptos/form-concepto/form-concepto.component').then(m => m.FormConceptoComponent), title: 'Concepto' },
    { path: 'conceptos/edit/:id', loadComponent: () => import('./conceptos/form-concepto/form-concepto.component').then(m => m.FormConceptoComponent), title: 'Editar concepto' },
    { path: 'bancos', loadComponent: () => import('./catalogos/bancos/bancos.component').then(m => m.BancosComponent), title: 'Bancos' },
    {
        path: 'bancos/new', loadComponent: () => import('./catalogos/bancos/form-banco/form-banco.component').then(m => m.FormBancoComponent), title: 'Nuevo banco',
        canActivate: [permisoGuard], data: { menuCodigo: 'TES_BANCO', accion: 'CREAR' }
    },
    { path: 'bancos/view/:id', loadComponent: () => import('./catalogos/bancos/form-banco/form-banco.component').then(m => m.FormBancoComponent), title: 'Banco' },
    {
        path: 'bancos/edit/:id', loadComponent: () => import('./catalogos/bancos/form-banco/form-banco.component').then(m => m.FormBancoComponent), title: 'Editar banco',
        canActivate: [permisoGuard], data: { menuCodigo: 'TES_BANCO', accion: 'EDITAR' }
    },
    { path: 'monitortesoreria', loadComponent: () => import('./monitor/monitortesoreria.component').then(m => m.MonitortesoreriaComponent), title: 'Monitor de Tesorería' },
];
