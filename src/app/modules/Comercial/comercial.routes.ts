import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso.guard';

export const COMERCIAL_ROUTES: Routes = [
    { path: 'clientes', loadComponent: () => import('./clientes/clientes.component').then(m => m.ClientesComponent), title: 'Clientes' },
    {
        path: 'clientes/new', loadComponent: () => import('./clientes/form-cliente/form-cliente.component').then(m => m.FormClienteComponent), title: 'Nuevo cliente',
        canActivate: [permisoGuard], data: { menuCodigo: 'VEN_CLI', accion: 'CREAR' }
    },
    { path: 'clientes/view/:id', loadComponent: () => import('./clientes/form-cliente/form-cliente.component').then(m => m.FormClienteComponent), title: 'Cliente' },
    {
        path: 'clientes/edit/:id', loadComponent: () => import('./clientes/form-cliente/form-cliente.component').then(m => m.FormClienteComponent), title: 'Editar cliente',
        canActivate: [permisoGuard], data: { menuCodigo: 'VEN_CLI', accion: 'EDITAR' }
    },
    { path: 'ventas', loadComponent: () => import('./venta-directa/venta-directa.component').then(m => m.VentaDirectaComponent), title: 'Venta Directa' },
    { path: 'ventas/new', loadComponent: () => import('./venta-directa/form-venta-directa/form-venta-directa.component').then(m => m.FormVentaDirectaComponent), title: 'Nueva venta' },
    { path: 'ventas/view/:id', loadComponent: () => import('./venta-directa/form-venta-directa/form-venta-directa.component').then(m => m.FormVentaDirectaComponent), title: 'Venta' },
    { path: 'ventas/edit/:id', loadComponent: () => import('./venta-directa/form-venta-directa/form-venta-directa.component').then(m => m.FormVentaDirectaComponent), title: 'Editar venta' },
    { path: 'ventapos', loadComponent: () => import('./venta-pos/venta-pos/venta-pos.component').then(m => m.VentaPosComponent), title: 'Venta POS' },
    { path: 'ventapos/new', loadComponent: () => import('./venta-pos/venta-pos/form-ventapos/form-ventapos.component').then(m => m.FormVentaposComponent), title: 'Nueva venta POS' },
    { path: 'ventapos/view/:id', loadComponent: () => import('./venta-pos/venta-pos/form-ventapos/form-ventapos.component').then(m => m.FormVentaposComponent), title: 'Venta POS' },
    { path: 'ventapos/edit/:id', loadComponent: () => import('./venta-pos/venta-pos/form-ventapos/form-ventapos.component').then(m => m.FormVentaposComponent), title: 'Editar venta POS' },
    { path: 'turno', loadComponent: () => import('./turnos/turnos.component').then(m => m.TurnosComponent), title: 'Turnos' },
    { path: 'turno/new', loadComponent: () => import('./turnos/form-turnos/form-turnos.component').then(m => m.FormTurnosComponent), title: 'Abrir turno' },
    { path: 'turno/view/:id', loadComponent: () => import('./turnos/form-turnos/form-turnos.component').then(m => m.FormTurnosComponent), title: 'Turno' },
    { path: 'turno/edit/:id', loadComponent: () => import('./turnos/form-turnos/form-turnos.component').then(m => m.FormTurnosComponent), title: 'Editar turno' },
    { path: 'cierreturno', loadComponent: () => import('./cierreturno/cierreturno.component').then(m => m.CierreturnoComponent), title: 'Cierre de Turno' },
    { path: 'cierreturno/new', loadComponent: () => import('./cierreturno/form-cierreturno/form-cierreturno.component').then(m => m.FormCierreturnoComponent), title: 'Nuevo cierre de turno' },
    { path: 'cierreturno/view/:id', loadComponent: () => import('./cierreturno/form-cierreturno/form-cierreturno.component').then(m => m.FormCierreturnoComponent), title: 'Cierre de turno' },
    { path: 'movimientocaja', loadComponent: () => import('./movimientocaja/movimientocaja.component').then(m => m.MovimientocajaComponent), title: 'Movimiento de Caja' },
    { path: 'movimientocaja/new', loadComponent: () => import('./movimientocaja/form-movimientocaja/form-movimientocaja.component').then(m => m.FormMovimientocajaComponent), title: 'Nuevo movimiento de caja' },
    { path: 'movimientocaja/view/:id', loadComponent: () => import('./movimientocaja/form-movimientocaja/form-movimientocaja.component').then(m => m.FormMovimientocajaComponent), title: 'Movimiento de caja' },
    { path: 'cajas', loadComponent: () => import('./cajas/cajas.component').then(m => m.CajasComponent), title: 'Cajas' },
    { path: 'cajas/new', loadComponent: () => import('./cajas/form-caja/form-caja.component').then(m => m.FormCajaComponent), title: 'Nueva caja' },
    { path: 'cajas/view/:id', loadComponent: () => import('./cajas/form-caja/form-caja.component').then(m => m.FormCajaComponent), title: 'Caja' },
    { path: 'cajas/edit/:id', loadComponent: () => import('./cajas/form-caja/form-caja.component').then(m => m.FormCajaComponent), title: 'Editar caja' },
    { path: 'mediospago', loadComponent: () => import('./mediospago/mediospago.component').then(m => m.MediospagoComponent), title: 'Medios de Pago' },
    { path: 'mediospago/new', loadComponent: () => import('./mediospago/form-mediospago/form-mediospago.component').then(m => m.FormMediospagoComponent), title: 'Nuevo medio de pago' },
    { path: 'mediospago/view/:id', loadComponent: () => import('./mediospago/form-mediospago/form-mediospago.component').then(m => m.FormMediospagoComponent), title: 'Medio de pago' },
    { path: 'mediospago/edit/:id', loadComponent: () => import('./mediospago/form-mediospago/form-mediospago.component').then(m => m.FormMediospagoComponent), title: 'Editar medio de pago' },
    { path: 'documentos-venta', loadComponent: () => import('./documentos-venta/documentos-venta.component').then(m => m.DocumentosVentaComponent), title: 'Documentos de Venta' },
    { path: 'documentos-venta/new', loadComponent: () => import('./documentos-venta/form-documento-venta/form-documento-venta.component').then(m => m.FormDocumentoVentaComponent), title: 'Nuevo documento de venta' },
    { path: 'documentos-venta/view/:idSucursal/:documento', loadComponent: () => import('./documentos-venta/form-documento-venta/form-documento-venta.component').then(m => m.FormDocumentoVentaComponent), title: 'Documento de venta' },
    { path: 'documentos-venta/edit/:idSucursal/:documento', loadComponent: () => import('./documentos-venta/form-documento-venta/form-documento-venta.component').then(m => m.FormDocumentoVentaComponent), title: 'Editar documento de venta' },
    { path: 'monitoroperaciones', loadComponent: () => import('./monitoroperaciones/monitoroperaciones.component').then(m => m.MonitoroperacionesComponent), title: 'Monitor de Operaciones' },
    { path: 'listaprecios', loadComponent: () => import('./lista-precios/lista-precios.component').then(m => m.ListaPreciosComponent), title: 'Lista de Precios' },
    { path: 'listaprecios/new', loadComponent: () => import('./lista-precios/form-lista-precio/form-lista-precio.component').then(m => m.FormListaPrecioComponent), title: 'Nueva lista de precios' },
    { path: 'listaprecios/view/:id', loadComponent: () => import('./lista-precios/form-lista-precio/form-lista-precio.component').then(m => m.FormListaPrecioComponent), title: 'Lista de precios' },
    { path: 'listaprecios/edit/:id', loadComponent: () => import('./lista-precios/form-lista-precio/form-lista-precio.component').then(m => m.FormListaPrecioComponent), title: 'Editar lista de precios' },
    { path: 'cargaprecios', loadComponent: () => import('./carga-precios/carga-precios.component').then(m => m.CargaPreciosComponent), title: 'Carga Masiva de Precios' },
    { path: 'cargaprecios/new', loadComponent: () => import('./carga-precios/form-carga-precios/form-carga-precios.component').then(m => m.FormCargaPreciosComponent), title: 'Nueva carga de precios' },
    { path: 'cargaprecios/view/:id', loadComponent: () => import('./carga-precios/form-carga-precios/form-carga-precios.component').then(m => m.FormCargaPreciosComponent), title: 'Carga de precios' },
    { path: 'confcomercial', loadComponent: () => import('./confcomercial/confcomercial.component').then(m => m.ConfcomercialComponent), title: 'Configuración Comercial' },
    { path: 'devolucionventas', loadComponent: () => import('./devolucion-ventas/devolucion-ventas.component').then(m => m.DevolucionVentasComponent), title: 'Nota Crédito' },
    {
        path: 'devolucionventas/new', loadComponent: () => import('./devolucion-ventas/form-devolucion-venta/form-devolucion-venta.component').then(m => m.FormDevolucionVentaComponent), title: 'Nueva nota crédito',
        canActivate: [permisoGuard], data: { menuCodigo: 'VEN_NOTACR', accion: 'CREAR' }
    },
    { path: 'devolucionventas/view/:id', loadComponent: () => import('./devolucion-ventas/form-devolucion-venta/form-devolucion-venta.component').then(m => m.FormDevolucionVentaComponent), title: 'Nota crédito' },
    {
        path: 'devolucionventas/edit/:id', loadComponent: () => import('./devolucion-ventas/form-devolucion-venta/form-devolucion-venta.component').then(m => m.FormDevolucionVentaComponent), title: 'Editar nota crédito',
        canActivate: [permisoGuard], data: { menuCodigo: 'VEN_NOTACR', accion: 'EDITAR' }
    },
    { path: 'motivosdevolucionventa', loadComponent: () => import('./motivos-devolucionventa/motivos-devolucionventa.component').then(m => m.MotivosDevolucionVentaComponent), title: 'Motivos Devolución Venta' },
    {
        path: 'motivosdevolucionventa/new', loadComponent: () => import('./motivos-devolucionventa/form-motivo/form-motivo.component').then(m => m.FormMotivoDevolucionVentaComponent), title: 'Nuevo motivo',
        canActivate: [permisoGuard], data: { menuCodigo: 'VEN_MOTIVO', accion: 'CREAR' }
    },
    { path: 'motivosdevolucionventa/view/:id', loadComponent: () => import('./motivos-devolucionventa/form-motivo/form-motivo.component').then(m => m.FormMotivoDevolucionVentaComponent), title: 'Motivo' },
    {
        path: 'motivosdevolucionventa/edit/:id', loadComponent: () => import('./motivos-devolucionventa/form-motivo/form-motivo.component').then(m => m.FormMotivoDevolucionVentaComponent), title: 'Editar motivo',
        canActivate: [permisoGuard], data: { menuCodigo: 'VEN_MOTIVO', accion: 'EDITAR' }
    },
];
