import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso.guard';

export const COMPRAS_ROUTES: Routes = [
    { path: 'proveedores', loadComponent: () => import('./proveedores/proveedores.component').then(m => m.ProveedoresComponent), title: 'Proveedores' },
    {
        path: 'proveedores/new', loadComponent: () => import('./proveedores/form-proveedor/form-proveedor.component').then(m => m.FormProveedorComponent), title: 'Nuevo proveedor',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_PRO', accion: 'CREAR' }
    },
    { path: 'proveedores/view/:id', loadComponent: () => import('./proveedores/form-proveedor/form-proveedor.component').then(m => m.FormProveedorComponent), title: 'Proveedor' },
    {
        path: 'proveedores/edit/:id', loadComponent: () => import('./proveedores/form-proveedor/form-proveedor.component').then(m => m.FormProveedorComponent), title: 'Editar proveedor',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_PRO', accion: 'EDITAR' }
    },
    { path: 'motivosdevolucion', loadComponent: () => import('./motivos-devolucion/motivos-devolucion.component').then(m => m.MotivosDevolucionComponent), title: 'Motivos de Devolución' },
    {
        path: 'motivosdevolucion/new', loadComponent: () => import('./motivos-devolucion/form-motivo/form-motivo.component').then(m => m.FormMotivoDevolucionComponent), title: 'Nuevo motivo de devolución',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_MOV', accion: 'CREAR' }
    },
    { path: 'motivosdevolucion/view/:id', loadComponent: () => import('./motivos-devolucion/form-motivo/form-motivo.component').then(m => m.FormMotivoDevolucionComponent), title: 'Motivo de devolución' },
    {
        path: 'motivosdevolucion/edit/:id', loadComponent: () => import('./motivos-devolucion/form-motivo/form-motivo.component').then(m => m.FormMotivoDevolucionComponent), title: 'Editar motivo de devolución',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_MOV', accion: 'EDITAR' }
    },
    { path: 'compras', loadComponent: () => import('./compra-directa/compra-directa.component').then(m => m.CompraDirectaComponent), title: 'Compra Directa' },
    {
        path: 'compras/new', loadComponent: () => import('./compra-directa/form-compra-directa/form-compra-directa.component').then(m => m.FormCompraDirectaComponent), title: 'Nueva compra',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_COMPRA', accion: 'CREAR' }
    },
    { path: 'compras/view/:id', loadComponent: () => import('./compra-directa/form-compra-directa/form-compra-directa.component').then(m => m.FormCompraDirectaComponent), title: 'Compra' },
    {
        path: 'compras/edit/:id', loadComponent: () => import('./compra-directa/form-compra-directa/form-compra-directa.component').then(m => m.FormCompraDirectaComponent), title: 'Editar compra',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_COMPRA', accion: 'EDITAR' }
    },
    { path: 'devolucioncompras', loadComponent: () => import('./devolucion-compras/devolucion-compras.component').then(m => m.DevolucionComprasComponent), title: 'Devolución a Proveedor' },
    {
        path: 'devolucioncompras/new', loadComponent: () => import('./devolucion-compras/form-devolucion/form-devolucion.component').then(m => m.FormDevolucionComponent), title: 'Nueva devolución',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_DEVOL', accion: 'CREAR' }
    },
    { path: 'devolucioncompras/view/:id', loadComponent: () => import('./devolucion-compras/form-devolucion/form-devolucion.component').then(m => m.FormDevolucionComponent), title: 'Devolución' },
    {
        path: 'devolucioncompras/edit/:id', loadComponent: () => import('./devolucion-compras/form-devolucion/form-devolucion.component').then(m => m.FormDevolucionComponent), title: 'Editar devolución',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_DEVOL', accion: 'EDITAR' }
    },
    { path: 'impuestos', loadComponent: () => import('./impuestos/impuestos.component').then(m => m.ImpuestosComponent), title: 'Impuestos' },
    {
        path: 'impuestos/new', loadComponent: () => import('./impuestos/form-impuesto/form-impuesto.component').then(m => m.FormImpuestoComponent), title: 'Nuevo impuesto',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_IMPUESTO', accion: 'CREAR' }
    },
    { path: 'impuestos/view/:id', loadComponent: () => import('./impuestos/form-impuesto/form-impuesto.component').then(m => m.FormImpuestoComponent), title: 'Impuesto' },
    {
        path: 'impuestos/edit/:id', loadComponent: () => import('./impuestos/form-impuesto/form-impuesto.component').then(m => m.FormImpuestoComponent), title: 'Editar impuesto',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_IMPUESTO', accion: 'EDITAR' }
    },
    { path: 'monitorcompras', loadComponent: () => import('./monitorcompras/monitorcompras.component').then(m => m.MonitorcomprasComponent), title: 'Monitor de Compras' },
    { path: 'confcompras', loadComponent: () => import('./confcompras/confcompras.component').then(m => m.ConfcomprasComponent), title: 'Configuración de Compras' },
    { path: 'utilidadxcategoria', loadComponent: () => import('./categoriasxutilidad/categoriasxutilidad.component').then(m => m.CategoriasxutilidadComponent), title: 'Utilidad x Categoría' },
    {
        path: 'utilidadxcategoria/new', loadComponent: () => import('./categoriasxutilidad/form-categoriaxutilidad/form-categoriaxutilidad.component').then(m => m.FormCategoriaxutilidadComponent), title: 'Nueva utilidad x categoría',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_UTILCAT', accion: 'CREAR' }
    },
    { path: 'utilidadxcategoria/view/:id', loadComponent: () => import('./categoriasxutilidad/form-categoriaxutilidad/form-categoriaxutilidad.component').then(m => m.FormCategoriaxutilidadComponent), title: 'Utilidad x categoría' },
    {
        path: 'utilidadxcategoria/edit/:id', loadComponent: () => import('./categoriasxutilidad/form-categoriaxutilidad/form-categoriaxutilidad.component').then(m => m.FormCategoriaxutilidadComponent), title: 'Editar utilidad x categoría',
        canActivate: [permisoGuard], data: { menuCodigo: 'COM_UTILCAT', accion: 'EDITAR' }
    },
];
