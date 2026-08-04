import { Routes } from '@angular/router';
import { CategoriasComponent } from './modules/Bodega/categorias/categorias.component';
import { FormCategoriaComponent } from './modules/Bodega/categorias/form-categoria/form-categoria.component';
import { AjusteStockComponent } from './modules/Bodega/ajuste-stock/ajuste-stock.component';
import { FormAjusteComponent } from './modules/Bodega/ajuste-stock/form-ajuste/form-ajuste.component';
import { MotivosAjusteComponent } from './modules/Bodega/motivos-ajuste/motivos-ajuste.component';
import { FormMotivoComponent } from './modules/Bodega/motivos-ajuste/form-motivo/form-motivo.component';
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
import { ImpuestosComponent } from './modules/compras/impuestos/impuestos.component';
import { FormImpuestoComponent } from './modules/compras/impuestos/form-impuesto/form-impuesto.component';
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
import { ListaPreciosComponent } from './modules/Comercial/lista-precios/lista-precios.component';
import { FormListaPrecioComponent } from './modules/Comercial/lista-precios/form-lista-precio/form-lista-precio.component';
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
        component: LoginComponent,
        title: 'Iniciar sesión'
    },
    // 2. Rutas protegidas bajo el diseño del menú (MatToolbar)
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'categorias', component: CategoriasComponent, title: 'Categorías' },
            {
                path: 'categoria/new', component: FormCategoriaComponent, title: 'Nueva categoría',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_CAT', accion: 'CREAR' }
            },
            { path: 'categoria/view/:id', component: FormCategoriaComponent, title: 'Categoría' },
            {
                path: 'categoria/edit/:id', component: FormCategoriaComponent, title: 'Editar categoría',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_CAT', accion: 'EDITAR' }
            },
            { path: 'articulos', component: ArticulosStockComponent, title: 'Artículos' },
            {
                path: 'articulos/new', component: FormArticuloComponent, title: 'Nuevo artículo',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_ART', accion: 'CREAR' }
            },
            { path: 'articulos/view/:id', component: FormArticuloComponent, title: 'Artículo' },
            {
                path: 'articulos/edit/:id', component: FormArticuloComponent, title: 'Editar artículo',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_ART', accion: 'EDITAR' }
            },
            { path: 'ajustestock', component: AjusteStockComponent, title: 'Ajuste de Stock' },
            {
                path: 'ajustestock/new', component: FormAjusteComponent, title: 'Nuevo ajuste de stock',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_AJU', accion: 'CREAR' }
            },
            {
                path: 'ajustestock/edit/:id', component: FormAjusteComponent, title: 'Editar ajuste de stock',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_AJU', accion: 'EDITAR' }
            },
            { path: 'ajustestock/view/:id', component: FormAjusteComponent, title: 'Ajuste de stock' },
            { path: 'motivosajuste', component: MotivosAjusteComponent, title: 'Motivos de Ajuste' },
            {
                path: 'motivosajuste/new', component: FormMotivoComponent, title: 'Nuevo motivo de ajuste',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_MOT', accion: 'CREAR' }
            },
            { path: 'motivosajuste/view/:id', component: FormMotivoComponent, title: 'Motivo de ajuste' },
            {
                path: 'motivosajuste/edit/:id', component: FormMotivoComponent, title: 'Editar motivo de ajuste',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_MOT', accion: 'EDITAR' }
            },
            { path: 'bodegas', component: BodegasComponent, title: 'Bodegas' },
            {
                path: 'bodegas/new', component: FormBodegaComponent, title: 'Nueva bodega',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_BOD', accion: 'CREAR' }
            },
            { path: 'bodegas/view/:id', component: FormBodegaComponent, title: 'Bodega' },
            {
                path: 'bodegas/edit/:id', component: FormBodegaComponent, title: 'Editar bodega',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_BOD', accion: 'EDITAR' }
            },
            { path: 'trasladobodega', component: TrasladoBodegasComponent, title: 'Traslado de Bodegas' },
            {
                path: 'trasladobodega/new', component: FormTrasladoComponent, title: 'Nuevo traslado',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_TRAS', accion: 'CREAR' }
            },
            {
                path: 'trasladobodega/edit/:id', component: FormTrasladoComponent, title: 'Editar traslado',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_TRAS', accion: 'EDITAR' }
            },
            { path: 'trasladobodega/view/:id', component: FormTrasladoComponent, title: 'Traslado de bodega' },
            { path: 'unidades', component: UnidadesStockComponent, title: 'Unidades' },
            {
                path: 'unidades/new', component: FormUnidadComponent, title: 'Nueva unidad',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_UNI', accion: 'CREAR' }
            },
            { path: 'unidades/view/:id', component: FormUnidadComponent, title: 'Unidad' },
            {
                path: 'unidades/edit/:id', component: FormUnidadComponent, title: 'Editar unidad',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_UNI', accion: 'EDITAR' }
            },
            { path: 'estados', component: EstadosComponent, title: 'Estados' },
            {
                path: 'estados/new', component: FormEstadoComponent, title: 'Nuevo estado',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_EST', accion: 'CREAR' }
            },
            { path: 'estados/view/:id', component: FormEstadoComponent, title: 'Estado' },
            {
                path: 'estados/edit/:id', component: FormEstadoComponent, title: 'Editar estado',
                canActivate: [permisoGuard], data: { menuCodigo: 'INV_EST', accion: 'EDITAR' }
            },
            { path: 'cargastock', component: CargastockComponent, title: 'Carga Masiva de Stock' },
            { path: 'cargastock/new', component: FormCargastockComponent, title: 'Nueva carga de stock' },
            { path: 'cargastock/view/:id', component: FormCargastockComponent, title: 'Carga de stock' },
            { path: 'proveedores', component: ProveedoresComponent, title: 'Proveedores' },
            { path: 'proveedores/new', component: FormProveedorComponent, title: 'Nuevo proveedor' },
            { path: 'proveedores/view/:id', component: FormProveedorComponent, title: 'Proveedor' },
            { path: 'proveedores/edit/:id', component: FormProveedorComponent, title: 'Editar proveedor' },
            { path: 'motivosdevolucion', component: MotivosDevolucionComponent, title: 'Motivos de Devolución' },
            { path: 'motivosdevolucion/new', component: FormMotivoDevolucionComponent, title: 'Nuevo motivo de devolución' },
            { path: 'motivosdevolucion/view/:id', component: FormMotivoDevolucionComponent, title: 'Motivo de devolución' },
            { path: 'motivosdevolucion/edit/:id', component: FormMotivoDevolucionComponent, title: 'Editar motivo de devolución' },
            { path: 'compras', component: CompraDirectaComponent, title: 'Compra Directa' },
            { path: 'compras/new', component: FormCompraDirectaComponent, title: 'Nueva compra' },
            { path: 'compras/view/:id', component: FormCompraDirectaComponent, title: 'Compra' },
            { path: 'compras/edit/:id', component: FormCompraDirectaComponent, title: 'Editar compra' },
            { path: 'devolucioncompras', component: DevolucionComprasComponent, title: 'Devolución a Proveedor' },
            { path: 'devolucioncompras/new', component: FormDevolucionComponent, title: 'Nueva devolución' },
            { path: 'devolucioncompras/view/:id', component: FormDevolucionComponent, title: 'Devolución' },
            { path: 'devolucioncompras/edit/:id', component: FormDevolucionComponent, title: 'Editar devolución' },
            { path: 'impuestos', component: ImpuestosComponent, title: 'Impuestos' },
            { path: 'impuestos/new', component: FormImpuestoComponent, title: 'Nuevo impuesto' },
            { path: 'impuestos/view/:id', component: FormImpuestoComponent, title: 'Impuesto' },
            { path: 'impuestos/edit/:id', component: FormImpuestoComponent, title: 'Editar impuesto' },
            { path: 'monitorcompras', component: MonitorcomprasComponent, title: 'Monitor de Compras' },
            { path: 'monitorstock', component: MonitorstockComponent, title: 'Monitor de Stock' },
            { path: 'monitoroperaciones', component: MonitoroperacionesComponent, title: 'Monitor de Operaciones' },
            { path: 'clientes/new', component: FormClienteComponent, title: 'Nuevo cliente' },
            { path: 'ventas', component: VentaDirectaComponent, title: 'Venta Directa' },
            { path: 'ventas/new', component: FormVentaDirectaComponent, title: 'Nueva venta' },
            { path: 'ventas/view/:id', component: FormVentaDirectaComponent, title: 'Venta' },
            { path: 'ventas/edit/:id', component: FormVentaDirectaComponent, title: 'Editar venta' },
            { path: 'ventapos', component: VentaPosComponent, title: 'Venta POS' },
            { path: 'ventapos/new', component: FormVentaposComponent, title: 'Nueva venta POS' },
            { path: 'ventapos/view/:id', component: FormVentaposComponent, title: 'Venta POS' },
            { path: 'ventapos/edit/:id', component: FormVentaposComponent, title: 'Editar venta POS' },
            { path: 'turno', component: TurnosComponent, title: 'Turnos' },
            { path: 'turno/new', component: FormTurnosComponent, title: 'Abrir turno' },
            { path: 'turno/view/:id', component: FormTurnosComponent, title: 'Turno' },
            { path: 'turno/edit/:id', component: FormTurnosComponent, title: 'Editar turno' },
            { path: 'cierreturno', component: CierreturnoComponent, title: 'Cierre de Turno' },
            { path: 'cierreturno/new', component: FormCierreturnoComponent, title: 'Nuevo cierre de turno' },
            { path: 'cierreturno/view/:id', component: FormCierreturnoComponent, title: 'Cierre de turno' },
            { path: 'movimientocaja', component: MovimientocajaComponent, title: 'Movimiento de Caja' },
            { path: 'movimientocaja/new', component: FormMovimientocajaComponent, title: 'Nuevo movimiento de caja' },
            { path: 'movimientocaja/view/:id', component: FormMovimientocajaComponent, title: 'Movimiento de caja' },
            { path: 'cajas', component: CajasComponent, title: 'Cajas' },
            { path: 'cajas/new', component: FormCajaComponent, title: 'Nueva caja' },
            { path: 'cajas/view/:id', component: FormCajaComponent, title: 'Caja' },
            { path: 'cajas/edit/:id', component: FormCajaComponent, title: 'Editar caja' },
            { path: 'mediospago', component: MediospagoComponent, title: 'Medios de Pago' },
            { path: 'mediospago/new', component: FormMediospagoComponent, title: 'Nuevo medio de pago' },
            { path: 'mediospago/view/:id', component: FormMediospagoComponent, title: 'Medio de pago' },
            { path: 'mediospago/edit/:id', component: FormMediospagoComponent, title: 'Editar medio de pago' },
            { path: 'documentos-venta', component: DocumentosVentaComponent, title: 'Documentos de Venta' },
            { path: 'documentos-venta/new', component: FormDocumentoVentaComponent, title: 'Nuevo documento de venta' },
            { path: 'documentos-venta/view/:idSucursal/:documento', component: FormDocumentoVentaComponent, title: 'Documento de venta' },
            { path: 'documentos-venta/edit/:idSucursal/:documento', component: FormDocumentoVentaComponent, title: 'Editar documento de venta' },
            { path: 'listaprecios', component: ListaPreciosComponent, title: 'Lista de Precios' },
            { path: 'listaprecios/new', component: FormListaPrecioComponent, title: 'Nueva lista de precios' },
            { path: 'listaprecios/view/:id', component: FormListaPrecioComponent, title: 'Lista de precios' },
            { path: 'listaprecios/edit/:id', component: FormListaPrecioComponent, title: 'Editar lista de precios' },
            { path: 'conceptos', component: ConceptosComponent, title: 'Conceptos' },
            { path: 'conceptos/new', component: FormConceptoComponent, title: 'Nuevo concepto' },
            { path: 'conceptos/view/:id', component: FormConceptoComponent, title: 'Concepto' },
            { path: 'conceptos/edit/:id', component: FormConceptoComponent, title: 'Editar concepto' },
            { path: 'administracion', component: AdministracionComponent, title: 'Administración' },
            { path: 'usuarios/new', component: FormUsuarioComponent, title: 'Nuevo usuario' },
            { path: 'usuarios/view/:id', component: FormUsuarioComponent, title: 'Usuario' },
            { path: 'usuarios/edit/:id', component: FormUsuarioComponent, title: 'Editar usuario' },
            { path: 'roles/new', component: FormRolComponent, title: 'Nuevo rol' },
            { path: 'roles/view/:id', component: FormRolComponent, title: 'Rol' },
            { path: 'roles/edit/:id', component: FormRolComponent, title: 'Editar rol' },
            { path: 'sucursales/new', component: FormSucursalComponent, title: 'Nueva sucursal' },
            { path: 'sucursales/view/:id', component: FormSucursalComponent, title: 'Sucursal' },
            { path: 'sucursales/edit/:id', component: FormSucursalComponent, title: 'Editar sucursal' },
            { path: 'negocios/new', component: FormNegocioComponent, title: 'Nuevo negocio' },
            { path: 'negocios/view/:id', component: FormNegocioComponent, title: 'Negocio' },
            { path: 'negocios/edit/:id', component: FormNegocioComponent, title: 'Editar negocio' },
            { path: 'login', component: LoginComponent, title: 'Iniciar sesión' },
            { path: 'no-autorizado', component: NoAutorizadoComponent, title: 'No autorizado' },
        ]
    },

    // Redirección comodín en caso de escribir cualquier otra ruta inexistente
    {
        path: '**',
        redirectTo: 'login'
    }
];
