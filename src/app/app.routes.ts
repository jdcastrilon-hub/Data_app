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
import { ProveedoresComponent } from './modules/compras/proveedores/proveedores.component';
import { FormProveedorComponent } from './modules/compras/proveedores/form-proveedor/form-proveedor.component';
import { CompraDirectaComponent } from './modules/compras/compra-directa/compra-directa.component';
import { FormCompraDirectaComponent } from './modules/compras/compra-directa/form-compra-directa/form-compra-directa.component';
import { FormArticuloComponent } from './modules/Bodega/articulos-stock/form-articulo/form-articulo.component';
import { MonitorcomprasComponent } from './modules/compras/monitorcompras/monitorcompras.component';
import { ArticulosStockComponent } from './modules/Bodega/articulos-stock/articulos-stock.component';
import { MonitorstockComponent } from './modules/Bodega/monitorstock/monitorstock.component';
import { ClientesComponent } from './modules/Comercial/clientes/clientes.component';
import { FormClienteComponent } from './modules/Comercial/clientes/form-cliente/form-cliente.component';
import { FormVentaDirectaComponent } from './modules/Comercial/venta-directa/form-venta-directa/form-venta-directa.component';

export const routes: Routes = [
    { path: 'categorias', component: CategoriasComponent },
    { path: 'categoria/new', component: FormCategoriaComponent },
    { path: 'categoria/edit/:id', component: FormCategoriaComponent },
    { path: 'articulos', component: ArticulosStockComponent },
    { path: 'articulos/new', component: FormArticuloComponent },
    { path: 'articulos/edit/:id', component: FormArticuloComponent },
    { path: 'ajustestock', component: AjusteStockComponent },
    { path: 'ajustestock/new', component: FormAjusteComponent },
    { path: 'ajustestock/view/:id', component: FormAjusteComponent },
    { path: 'motivosajuste', component: MotivosAjusteComponent },
    { path: 'motivosajuste/new', component: FormMotivoComponent },
    { path: 'inventariostock', component: InventarioStockComponent },
    { path: 'bodegas', component: BodegasComponent },
    { path: 'bodegas/new', component: FormBodegaComponent },
    { path: 'bodegas/view/:id', component: FormBodegaComponent },
    { path: 'bodegas/edit/:id', component: FormBodegaComponent },
    { path: 'trasladobodega', component: TrasladoBodegasComponent },
    { path: 'trasladobodega/new', component: FormTrasladoComponent },
    { path: 'proveedores', component: ProveedoresComponent },
    { path: 'proveedores/new', component: FormProveedorComponent },
    { path: 'compras', component: CompraDirectaComponent },
    { path: 'compras/new', component: FormCompraDirectaComponent },
    { path: 'compras/edit/:id', component: FormCompraDirectaComponent },
    { path: 'monitorcompras', component: MonitorcomprasComponent },
    { path: 'monitorstock', component: MonitorstockComponent },
    { path: 'clientes/new', component: FormClienteComponent },
    { path: 'ventas/new', component: FormVentaDirectaComponent },
    

    


];
