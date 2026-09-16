import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso.guard';

export const BODEGA_ROUTES: Routes = [
    { path: 'categorias', loadComponent: () => import('./categorias/categorias.component').then(m => m.CategoriasComponent), title: 'Categorías' },
    {
        path: 'categoria/new', loadComponent: () => import('./categorias/form-categoria/form-categoria.component').then(m => m.FormCategoriaComponent), title: 'Nueva categoría',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_CAT', accion: 'CREAR' }
    },
    { path: 'categoria/view/:id', loadComponent: () => import('./categorias/form-categoria/form-categoria.component').then(m => m.FormCategoriaComponent), title: 'Categoría' },
    {
        path: 'categoria/edit/:id', loadComponent: () => import('./categorias/form-categoria/form-categoria.component').then(m => m.FormCategoriaComponent), title: 'Editar categoría',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_CAT', accion: 'EDITAR' }
    },
    { path: 'articulos', loadComponent: () => import('./articulos-stock/articulos-stock.component').then(m => m.ArticulosStockComponent), title: 'Artículos' },
    {
        path: 'articulos/new', loadComponent: () => import('./articulos-stock/form-articulo/form-articulo.component').then(m => m.FormArticuloComponent), title: 'Nuevo artículo',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_ART', accion: 'CREAR' }
    },
    { path: 'articulos/view/:id', loadComponent: () => import('./articulos-stock/form-articulo/form-articulo.component').then(m => m.FormArticuloComponent), title: 'Artículo' },
    {
        path: 'articulos/edit/:id', loadComponent: () => import('./articulos-stock/form-articulo/form-articulo.component').then(m => m.FormArticuloComponent), title: 'Editar artículo',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_ART', accion: 'EDITAR' }
    },
    { path: 'ajustestock', loadComponent: () => import('./ajuste-stock/ajuste-stock.component').then(m => m.AjusteStockComponent), title: 'Ajuste de Stock' },
    {
        path: 'ajustestock/new', loadComponent: () => import('./ajuste-stock/form-ajuste/form-ajuste.component').then(m => m.FormAjusteComponent), title: 'Nuevo ajuste de stock',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_AJU', accion: 'CREAR' }
    },
    {
        path: 'ajustestock/edit/:id', loadComponent: () => import('./ajuste-stock/form-ajuste/form-ajuste.component').then(m => m.FormAjusteComponent), title: 'Editar ajuste de stock',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_AJU', accion: 'EDITAR' }
    },
    { path: 'ajustestock/view/:id', loadComponent: () => import('./ajuste-stock/form-ajuste/form-ajuste.component').then(m => m.FormAjusteComponent), title: 'Ajuste de stock' },
    { path: 'motivosajuste', loadComponent: () => import('./motivos-ajuste/motivos-ajuste.component').then(m => m.MotivosAjusteComponent), title: 'Motivos de Ajuste' },
    {
        path: 'motivosajuste/new', loadComponent: () => import('./motivos-ajuste/form-motivo/form-motivo.component').then(m => m.FormMotivoComponent), title: 'Nuevo motivo de ajuste',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_MOT', accion: 'CREAR' }
    },
    { path: 'motivosajuste/view/:id', loadComponent: () => import('./motivos-ajuste/form-motivo/form-motivo.component').then(m => m.FormMotivoComponent), title: 'Motivo de ajuste' },
    {
        path: 'motivosajuste/edit/:id', loadComponent: () => import('./motivos-ajuste/form-motivo/form-motivo.component').then(m => m.FormMotivoComponent), title: 'Editar motivo de ajuste',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_MOT', accion: 'EDITAR' }
    },
    { path: 'bodegas', loadComponent: () => import('./bodegas/bodegas.component').then(m => m.BodegasComponent), title: 'Bodegas' },
    {
        path: 'bodegas/new', loadComponent: () => import('./bodegas/form-bodega/form-bodega.component').then(m => m.FormBodegaComponent), title: 'Nueva bodega',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_BOD', accion: 'CREAR' }
    },
    { path: 'bodegas/view/:id', loadComponent: () => import('./bodegas/form-bodega/form-bodega.component').then(m => m.FormBodegaComponent), title: 'Bodega' },
    {
        path: 'bodegas/edit/:id', loadComponent: () => import('./bodegas/form-bodega/form-bodega.component').then(m => m.FormBodegaComponent), title: 'Editar bodega',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_BOD', accion: 'EDITAR' }
    },
    { path: 'trasladobodega', loadComponent: () => import('./traslado-bodegas/traslado-bodegas.component').then(m => m.TrasladoBodegasComponent), title: 'Traslado de Bodegas' },
    {
        path: 'trasladobodega/new', loadComponent: () => import('./traslado-bodegas/form-traslado/form-traslado.component').then(m => m.FormTrasladoComponent), title: 'Nuevo traslado',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_TRAS', accion: 'CREAR' }
    },
    {
        path: 'trasladobodega/edit/:id', loadComponent: () => import('./traslado-bodegas/form-traslado/form-traslado.component').then(m => m.FormTrasladoComponent), title: 'Editar traslado',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_TRAS', accion: 'EDITAR' }
    },
    { path: 'trasladobodega/view/:id', loadComponent: () => import('./traslado-bodegas/form-traslado/form-traslado.component').then(m => m.FormTrasladoComponent), title: 'Traslado de bodega' },
    { path: 'unidades', loadComponent: () => import('./unidadesStock/unidadesStock.component').then(m => m.UnidadesStockComponent), title: 'Unidades' },
    {
        path: 'unidades/new', loadComponent: () => import('./unidadesStock/form-unidad/form-unidad.component').then(m => m.FormUnidadComponent), title: 'Nueva unidad',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_UNI', accion: 'CREAR' }
    },
    { path: 'unidades/view/:id', loadComponent: () => import('./unidadesStock/form-unidad/form-unidad.component').then(m => m.FormUnidadComponent), title: 'Unidad' },
    {
        path: 'unidades/edit/:id', loadComponent: () => import('./unidadesStock/form-unidad/form-unidad.component').then(m => m.FormUnidadComponent), title: 'Editar unidad',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_UNI', accion: 'EDITAR' }
    },
    { path: 'estados', loadComponent: () => import('./estados/estados.component').then(m => m.EstadosComponent), title: 'Estados' },
    {
        path: 'estados/new', loadComponent: () => import('./estados/form-estado/form-estado.component').then(m => m.FormEstadoComponent), title: 'Nuevo estado',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_EST', accion: 'CREAR' }
    },
    { path: 'estados/view/:id', loadComponent: () => import('./estados/form-estado/form-estado.component').then(m => m.FormEstadoComponent), title: 'Estado' },
    {
        path: 'estados/edit/:id', loadComponent: () => import('./estados/form-estado/form-estado.component').then(m => m.FormEstadoComponent), title: 'Editar estado',
        canActivate: [permisoGuard], data: { menuCodigo: 'INV_EST', accion: 'EDITAR' }
    },
    { path: 'cargastock', loadComponent: () => import('./cargastock/cargastock.component').then(m => m.CargastockComponent), title: 'Carga Masiva de Stock' },
    { path: 'cargastock/new', loadComponent: () => import('./cargastock/form-cargastock/form-cargastock.component').then(m => m.FormCargastockComponent), title: 'Nueva carga de stock' },
    { path: 'cargastock/view/:id', loadComponent: () => import('./cargastock/form-cargastock/form-cargastock.component').then(m => m.FormCargastockComponent), title: 'Carga de stock' },
    { path: 'monitorstock', loadComponent: () => import('./monitorstock/monitorstock.component').then(m => m.MonitorstockComponent), title: 'Monitor de Stock' },
];
