import { Routes } from '@angular/router';

export const ADMINISTRACION_ROUTES: Routes = [
    { path: 'administracion', loadComponent: () => import('./administracion.component').then(m => m.AdministracionComponent), title: 'Administración' },
    { path: 'usuarios/new', loadComponent: () => import('./usuarios/form-usuario/form-usuario.component').then(m => m.FormUsuarioComponent), title: 'Nuevo usuario' },
    { path: 'usuarios/view/:id', loadComponent: () => import('./usuarios/form-usuario/form-usuario.component').then(m => m.FormUsuarioComponent), title: 'Usuario' },
    { path: 'usuarios/edit/:id', loadComponent: () => import('./usuarios/form-usuario/form-usuario.component').then(m => m.FormUsuarioComponent), title: 'Editar usuario' },
    { path: 'roles/new', loadComponent: () => import('./roles/form-rol/form-rol.component').then(m => m.FormRolComponent), title: 'Nuevo rol' },
    { path: 'roles/view/:id', loadComponent: () => import('./roles/form-rol/form-rol.component').then(m => m.FormRolComponent), title: 'Rol' },
    { path: 'roles/edit/:id', loadComponent: () => import('./roles/form-rol/form-rol.component').then(m => m.FormRolComponent), title: 'Editar rol' },
    { path: 'sucursales/new', loadComponent: () => import('./sucursales/form-sucursal/form-sucursal.component').then(m => m.FormSucursalComponent), title: 'Nueva sucursal' },
    { path: 'sucursales/view/:id', loadComponent: () => import('./sucursales/form-sucursal/form-sucursal.component').then(m => m.FormSucursalComponent), title: 'Sucursal' },
    { path: 'sucursales/edit/:id', loadComponent: () => import('./sucursales/form-sucursal/form-sucursal.component').then(m => m.FormSucursalComponent), title: 'Editar sucursal' },
    { path: 'negocios/new', loadComponent: () => import('./negocios/form-negocio/form-negocio.component').then(m => m.FormNegocioComponent), title: 'Nuevo negocio' },
    { path: 'negocios/view/:id', loadComponent: () => import('./negocios/form-negocio/form-negocio.component').then(m => m.FormNegocioComponent), title: 'Negocio' },
    { path: 'negocios/edit/:id', loadComponent: () => import('./negocios/form-negocio/form-negocio.component').then(m => m.FormNegocioComponent), title: 'Editar negocio' },
];
