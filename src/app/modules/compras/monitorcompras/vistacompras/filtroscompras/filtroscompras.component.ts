import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild, output, signal } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { BodegaCombo } from 'src/app/core/interfaces/Bodega/BodegaCombo';
import { SucursalCombo } from 'src/app/core/interfaces/Core/SucursalCombo';
import { ArticuloSearch } from 'src/app/core/models/Bodega/ArticuloSearch';
import { ProveedorSearch } from 'src/app/core/interfaces/Compras/ProveedorSearch';
import { MonitorComprasFiltros } from 'src/app/core/interfaces/Compras/MonitorComprasFiltros';
import { ComboArticuloComponent } from 'src/app/modules/resources/combo-articulo/combo-articulo.component';
import { ComboProveedorComponent } from 'src/app/modules/resources/combo-proveedor/combo-proveedor.component';

@Component({
  selector: 'filtroscompras',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatCardModule, FlexLayoutModule, MatTableModule, MatTabsModule, ComboArticuloComponent, ComboProveedorComponent],
  templateUrl: './filtroscompras.component.html',
  styleUrl: './filtroscompras.component.scss'
})
export class FiltroscomprasComponent implements OnInit, OnChanges {

  @Input() obj_filtros!: MonitorComprasFiltros;
  alConsultar = output<any>();

  @ViewChild(ComboArticuloComponent) comboArticuloRef!: ComboArticuloComponent;
  @ViewChild(ComboProveedorComponent) comboProveedorRef!: ComboProveedorComponent;

  // Sucursal / Bodega
  list_sucursal: SucursalCombo[] = [];
  list_bodegas: BodegaCombo[] = [];
  SelectSucursalControl = new FormControl<SucursalCombo | null>(null);
  SelectBodegasControl = new FormControl<BodegaCombo | null | 'TODOS'>('TODOS');

  // Articulos seleccionados (tab "Articulos")
  articulosSeleccionados: ArticuloSearch[] = [];
  columnasArticulos: string[] = ['codArticulo', 'nomArticulo', 'acciones'];

  // Proveedores seleccionados (tab "Proveedores")
  proveedoresSeleccionados: ProveedorSearch[] = [];
  columnasProveedores: string[] = ['codTit', 'nombreCompleto', 'acciones'];

  filtro = signal({
    id_sucursal: 0,
    id_bodega: 0,
    fechaInicio: new Date() as any,
    fechaFin: new Date() as any,
    articulos: [] as number[],
    proveedores: [] as number[]
  });

  ngOnInit(): void {
    this.SelectSucursalControl.valueChanges.subscribe(sucursal => {
      this.list_bodegas = sucursal?.list_bodegas || [];
      this.filtro.update(f => ({ ...f, id_sucursal: sucursal?.id ?? 0 }));
      // Al cambiar de sucursal reiniciamos la bodega elegida
      this.SelectBodegasControl.setValue('TODOS');
    });

    this.SelectBodegasControl.valueChanges.subscribe(bodega => {
      if (bodega && typeof bodega === 'object') {
        this.filtro.update(f => ({ ...f, id_bodega: bodega.id ?? 0 }));
      } else {
        this.filtro.update(f => ({ ...f, id_bodega: 0 }));
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['obj_filtros'] && this.obj_filtros) {
      this.list_sucursal = this.obj_filtros.listsucursales || [];
      // La sucursal arranca en la primera de la lista para que el combo de Bodegas se cargue solo
      if (!this.SelectSucursalControl.value && this.list_sucursal.length) {
        this.SelectSucursalControl.setValue(this.list_sucursal[0]);
      }
    }
  }

  enviarConsulta() {
    this.alConsultar.emit(this.filtro());
  }

  agregarArticulo(articulo: ArticuloSearch) {
    if (articulo) {
      const yaExiste = this.articulosSeleccionados.some(a => a.idArticulo === articulo.idArticulo);
      if (!yaExiste) {
        this.articulosSeleccionados = [...this.articulosSeleccionados, articulo];
        this.filtro.update(f => ({ ...f, articulos: this.articulosSeleccionados.map(a => a.idArticulo!) }));
      }
    }
    this.comboArticuloRef?.resetCampo();
  }

  quitarArticulo(articulo: ArticuloSearch) {
    this.articulosSeleccionados = this.articulosSeleccionados.filter(a => a.idArticulo !== articulo.idArticulo);
    this.filtro.update(f => ({ ...f, articulos: this.articulosSeleccionados.map(a => a.idArticulo!) }));
  }

  agregarProveedor(proveedor: ProveedorSearch) {
    if (proveedor) {
      const yaExiste = this.proveedoresSeleccionados.some(p => p.idProveedor === proveedor.idProveedor);
      if (!yaExiste) {
        this.proveedoresSeleccionados = [...this.proveedoresSeleccionados, proveedor];
        this.filtro.update(f => ({ ...f, proveedores: this.proveedoresSeleccionados.map(p => p.idProveedor!) }));
      }
    }
    this.comboProveedorRef?.resetCampo();
  }

  quitarProveedor(proveedor: ProveedorSearch) {
    this.proveedoresSeleccionados = this.proveedoresSeleccionados.filter(p => p.idProveedor !== proveedor.idProveedor);
    this.filtro.update(f => ({ ...f, proveedores: this.proveedoresSeleccionados.map(p => p.idProveedor!) }));
  }
}
