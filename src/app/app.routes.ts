import { Routes } from '@angular/router';
import { CategoriasComponent } from './modules/Bodega/categorias/categorias.component';
import { FormCategoriaComponent } from './modules/Bodega/categorias/form-categoria/form-categoria.component';
import { AjusteStockComponent } from './modules/Bodega/ajuste-stock/ajuste-stock.component';
import { FormAjusteComponent } from './modules/Bodega/ajuste-stock/form-ajuste/form-ajuste.component';
import { MotivosAjusteComponent } from './modules/Bodega/motivos-ajuste/motivos-ajuste.component';
import { FormMotivoComponent } from './modules/Bodega/motivos-ajuste/form-motivo/form-motivo.component';
import { InventarioStockComponent } from './modules/Bodega/inventario-stock/inventario-stock.component';
import { BodegasComponent } from './modules/Bodega/bodegas/bodegas.component';
import { FormBodegaComponent } from './modules/Bodega/bodegas/form-bodega/form-bodega.component';
import { TrasladoBodegasComponent } from './modules/Bodega/traslado-bodegas/traslado-bodegas.component';
import { FormTrasladoComponent } from './modules/Bodega/traslado-bodegas/form-traslado/form-traslado.component';
import { UnidadesStockComponent } from './modules/Bodega/unidadesStock/unidadesStock.component';
import { FormUnidadComponent } from './modules/Bodega/unidadesStock/form-unidad/form-unidad.component';
import { EstadosComponent } from './modules/Bodega/estados/estados.component';
import { FormEstadoComponent } from './modules/Bodega/estados/form-estado/form-estado.component';
import { CargastockComponent } from './modules/Bodega/cargastock/cargastock.component';
import { FormCargastockComponent } from './modules/Bodega/cargastock/form-cargastock/form-cargastock.component';
import { ProveedoresComponent } from './modules/compras/proveedores/proveedores.component';
import { FormProveedorComponent } from './modules/compras/proveedores/form-proveedor/form-proveedor.component';
import { CompraDirectaComponent } from './modules/compras/compra-directa/compra-directa.component';
import { MotivosDevolucionComponent } from './modules/compras/motivos-devolucion/motivos-devolucion.component';
import { FormMotivoDevolucionComponent } from './modules/compras/motivos-devolucion/form-motivo/form-motivo.component';
import { FormCompraDirectaComponent } from './modules/compras/compra-directa/form-compra-directa/form-compra-directa.component';
import { DevolucionComprasComponent } from './modules/compras/devolucion-compras/devolucion-compras.component';
import { FormDevolucionComponent } from './modules/compras/devolucion-compras/form-devolucion/form-devolucion.component';
import { FormArticuloComponent } from './modules/Bodega/articulos-stock/form-articulo/form-articulo.component';
import { MonitorcomprasComponent } from './modules/compras/monitorcompras/monitorcompras.component';
import { ArticulosStockComponent } from './modules/Bodega/articulos-stock/articulos-stock.component';
import { MonitorstockComponent } from './modules/Bodega/monitorstock/monitorstock.component';
import { FormClienteComponent } from './modules/Comercial/clientes/form-cliente/form-cliente.component';
import { FormVentaDirectaComponent } from './modules/Comercial/venta-directa/form-venta-directa/form-venta-directa.component';
import { VentaDirectaComponent } from './modules/Comercial/venta-directa/venta-directa.component';
import { FormVentaposComponent } from './modules/Comercial/venta-pos/venta-pos/form-ventapos/form-ventapos.component';
import { VentaPosComponent } from './modules/Comercial/venta-pos/venta-pos/venta-pos.component';
import { FormTurnosComponent } from './modules/Comercial/turnos/form-turnos/form-turnos.component';
import { TurnosComponent } from './modules/Comercial/turnos/turnos.component';
import { FormCierreturnoComponent } from './modules/Comercial/cierreturno/form-cierreturno/form-cierreturno.component';
import { CierreturnoComponent } from './modules/Comercial/cierreturno/cierreturno.component';
import { FormMovimientocajaComponent } from './modules/Comercial/movimientocaja/form-movimientocaja/form-movimientocaja.component';
import { MovimientocajaComponent } from './modules/Comercial/movimientocaja/movimientocaja.component';
import { CajasComponent } from './modules/Comercial/cajas/cajas.component';
import { FormCajaComponent } from './modules/Comercial/cajas/form-caja/form-caja.component';
import { MediospagoComponent } from './modules/Comercial/mediospago/mediospago.component';
import { FormMediospagoComponent } from './modules/Comercial/mediospago/form-mediospago/form-mediospago.component';
import { DocumentosVentaComponent } from './modules/Comercial/documentos-venta/documentos-venta.component';
import { FormDocumentoVentaComponent } from './modules/Comercial/documentos-venta/form-documento-venta/form-documento-venta.component';
import { MonitoroperacionesComponent } from './modules/Comercial/monitoroperaciones/monitoroperaciones.component';
import { ConceptosComponent } from './modules/tesoreria/conceptos/conceptos.component';
import { FormConceptoComponent } from './modules/tesoreria/conceptos/form-concepto/form-concepto.component';
import { AdministracionComponent } from './modules/administracion/administracion.component';
import { FormUsuarioComponent } from './modules/administracion/usuarios/form-usuario/form-usuario.component';
import { FormRolComponent } from './modules/administracion/roles/form-rol/form-rol.component';
import { FormSucursalComponent } from './modules/administracion/sucursales/form-sucursal/form-sucursal.component';
import { FormNegocioComponent } from './modules/administracion/negocios/form-negocio/form-negocio.component';
import { LoginComponent } from './core/login/login.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { permisoGuard } from './core/guards/permiso.guard';
import { NoAutorizadoComponent } from './modules/resources/no-autorizado/no-autorizado.component';

export const routes: Routes = [
    // 1. Ruta pública e independiente a pantalla completa
    {
        path: 'login',
        component: LoginComponent
    },
    // 2. Rutas protegidas bajo el diseño del menú (MatToolbar)
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'categorias', component: CategoriasComponent },
            {
                path: 'categoria/new', component: FormCategoriaComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_CAT', accion: 'CREAR' }
            },
            { path: 'categoria/view/:id', component: FormCategoriaComponent },
            {
                path: 'categoria/edit/:id', component: FormCategoriaComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_CAT', accion: 'EDITAR' }
            },
            { path: 'articulos', component: ArticulosStockComponent },
            {
                path: 'articulos/new', component: FormArticuloComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_ART', accion: 'CREAR' }
            },
            { path: 'articulos/view/:id', component: FormArticuloComponent },
            {
                path: 'articulos/edit/:id', component: FormArticuloComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_ART', accion: 'EDITAR' }
            },
            { path: 'ajustestock', component: AjusteStockComponent },
            {
                path: 'ajustestock/new', component: FormAjusteComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_AJU', accion: 'CREAR' }
            },
            {
                path: 'ajustestock/edit/:id', component: FormAjusteComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_AJU', accion: 'EDITAR' }
            },
            { path: 'ajustestock/view/:id', component: FormAjusteComponent },
            { path: 'motivosajuste', component: MotivosAjusteComponent },
            {
                path: 'motivosajuste/new', component: FormMotivoComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_MOT', accion: 'CREAR' }
            },
            { path: 'motivosajuste/view/:id', component: FormMotivoComponent },
            {
                path: 'motivosajuste/edit/:id', component: FormMotivoComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_MOT', accion: 'EDITAR' }
            },
            { path: 'inventariostock', component: InventarioStockComponent },
            { path: 'bodegas', component: BodegasComponent },
            {
                path: 'bodegas/new', component: FormBodegaComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_BOD', accion: 'CREAR' }
            },
            { path: 'bodegas/view/:id', component: FormBodegaComponent },
            {
                path: 'bodegas/edit/:id', component: FormBodegaComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_BOD', accion: 'EDITAR' }
            },
            { path: 'trasladobodega', component: TrasladoBodegasComponent },
            {
                path: 'trasladobodega/new', component: FormTrasladoComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_TRAS', accion: 'CREAR' }
            },
            {
                path: 'trasladobodega/edit/:id', component: FormTrasladoComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_TRAS', accion: 'EDITAR' }
            },
            { path: 'trasladobodega/view/:id', component: FormTrasladoComponent },
            { path: 'unidades', component: UnidadesStockComponent },
            {
                path: 'unidades/new', component: FormUnidadComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_UNI', accion: 'CREAR' }
            },
            { path: 'unidades/view/:id', component: FormUnidadComponent },
            {
                path: 'unidades/edit/:id', component: FormUnidadComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_UNI', accion: 'EDITAR' }
            },
            { path: 'estados', component: EstadosComponent },
            {
                path: 'estados/new', component: FormEstadoComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_EST', accion: 'CREAR' }
            },
            { path: 'estados/view/:id', component: FormEstadoComponent },
            {
                path: 'estados/edit/:id', component: FormEstadoComponent,
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_EST', accion: 'EDITAR' }
            },
            { path: 'cargastock', component: CargastockComponent },
            { path: 'cargastock/new', component: FormCargastockComponent },
            { path: 'cargastock/view/:id', component: FormCargastockComponent },
            { path: 'proveedores', component: ProveedoresComponent },
            { path: 'proveedores/new', component: FormProveedorComponent },
            { path: 'proveedores/view/:id', component: FormProveedorComponent },
            { path: 'proveedores/edit/:id', component: FormProveedorComponent },
            { path: 'motivosdevolucion', component: MotivosDevolucionComponent },
            { path: 'motivosdevolucion/new', component: FormMotivoDevolucionComponent },
            { path: 'motivosdevolucion/view/:id', component: FormMotivoDevolucionComponent },
            { path: 'motivosdevolucion/edit/:id', component: FormMotivoDevolucionComponent },
            { path: 'compras', component: CompraDirectaComponent },
            { path: 'compras/new', component: FormCompraDirectaComponent },
            { path: 'compras/view/:id', component: FormCompraDirectaComponent },
            { path: 'compras/edit/:id', component: FormCompraDirectaComponent },
            { path: 'devolucioncompras', component: DevolucionComprasComponent },
            { path: 'devolucioncompras/new', component: FormDevolucionComponent },
            { path: 'devolucioncompras/view/:id', component: FormDevolucionComponent },
            { path: 'devolucioncompras/edit/:id', component: FormDevolucionComponent },
            { path: 'monitorcompras', component: MonitorcomprasComponent },
            { path: 'monitorstock', component: MonitorstockComponent },
            { path: 'monitoroperaciones', component: MonitoroperacionesComponent },
            { path: 'clientes/new', component: FormClienteComponent },
            { path: 'ventas', component: VentaDirectaComponent },
            { path: 'ventas/new', component: FormVentaDirectaComponent },
            { path: 'ventas/view/:id', component: FormVentaDirectaComponent },
            { path: 'ventas/edit/:id', component: FormVentaDirectaComponent },
            { path: 'ventapos', component: VentaPosComponent },
            { path: 'ventapos/new', component: FormVentaposComponent },
            { path: 'ventapos/view/:id', component: FormVentaposComponent },
            { path: 'ventapos/edit/:id', component: FormVentaposComponent },
            { path: 'turno', component: TurnosComponent },
            { path: 'turno/new', component: FormTurnosComponent },
            { path: 'turno/view/:id', component: FormTurnosComponent },
            { path: 'turno/edit/:id', component: FormTurnosComponent },
            { path: 'cierreturno', component: CierreturnoComponent },
            { path: 'cierreturno/new', component: FormCierreturnoComponent },
            { path: 'cierreturno/view/:id', component: FormCierreturnoComponent },
            { path: 'movimientocaja', component: MovimientocajaComponent },
            { path: 'movimientocaja/new', component: FormMovimientocajaComponent },
            { path: 'movimientocaja/view/:id', component: FormMovimientocajaComponent },
            { path: 'cajas', component: CajasComponent },
            { path: 'cajas/new', component: FormCajaComponent },
            { path: 'cajas/view/:id', component: FormCajaComponent },
            { path: 'cajas/edit/:id', component: FormCajaComponent },
            { path: 'mediospago', component: MediospagoComponent },
            { path: 'mediospago/new', component: FormMediospagoComponent },
            { path: 'mediospago/view/:id', component: FormMediospagoComponent },
            { path: 'mediospago/edit/:id', component: FormMediospagoComponent },
            { path: 'documentos-venta', component: DocumentosVentaComponent },
            { path: 'documentos-venta/new', component: FormDocumentoVentaComponent },
            { path: 'documentos-venta/view/:idSucursal/:documento', component: FormDocumentoVentaComponent },
            { path: 'documentos-venta/edit/:idSucursal/:documento', component: FormDocumentoVentaComponent },            
            { path: 'conceptos', component: ConceptosComponent },
            { path: 'conceptos/new', component: FormConceptoComponent },
            { path: 'conceptos/view/:id', component: FormConceptoComponent },
            { path: 'conceptos/edit/:id', component: FormConceptoComponent },
            { path: 'administracion', component: AdministracionComponent },
            { path: 'usuarios/new', component: FormUsuarioComponent },
            { path: 'usuarios/view/:id', component: FormUsuarioComponent },
            { path: 'usuarios/edit/:id', component: FormUsuarioComponent },
            { path: 'roles/new', component: FormRolComponent },
            { path: 'roles/view/:id', component: FormRolComponent },
            { path: 'roles/edit/:id', component: FormRolComponent },
            { path: 'sucursales/new', component: FormSucursalComponent },
            { path: 'sucursales/view/:id', component: FormSucursalComponent },
            { path: 'sucursales/edit/:id', component: FormSucursalComponent },
            { path: 'negocios/new', component: FormNegocioComponent },
            { path: 'negocios/view/:id', component: FormNegocioComponent },
            { path: 'negocios/edit/:id', component: FormNegocioComponent },
            { path: 'login', component: LoginComponent },
            { path: 'no-autorizado', component: NoAutorizadoComponent },
        ]
    },

    // Redirección comodín en caso de escribir cualquier otra ruta inexistente
    {
        path: '**',
        redirectTo: 'login'
    }
];

