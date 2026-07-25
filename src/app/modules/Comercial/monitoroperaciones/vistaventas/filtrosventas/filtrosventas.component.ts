import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild, output, signal } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { CajaCombo } from 'src/app/core/interfaces/Comercial/CajaCombo';
import { ClienteSearch } from 'src/app/core/interfaces/Comercial/ClienteSearch';
import { MonitorOperacionesFiltros } from 'src/app/core/interfaces/Comercial/MonitorOperacionesFiltros';
import { SucursalXCajas } from 'src/app/core/interfaces/Comercial/SucursalXCajas';
import { ArticuloSearch } from 'src/app/core/models/Bodega/ArticuloSearch';
import { ComboArticuloComponent } from 'src/app/modules/resources/combo-articulo/combo-articulo.component';
import { ComboClienteComponent } from 'src/app/modules/resources/combo-cliente/combo-cliente.component';

// Tipos de documento de venta (t_facturas). "Nota" queda preparada para cuando
// exista un flujo real de notas credito/debito de venta - hoy no hay datos
// reales de ese tipo, pero la opcion ya vive en el filtro.
const TIPOS_DOCUMENTO_OPCIONES = ['Factura', 'Nota'];

@Component({
  selector: 'filtrosventas',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatCardModule, MatCheckboxModule, FlexLayoutModule, MatTableModule, MatTabsModule,
    ComboArticuloComponent, ComboClienteComponent],
  templateUrl: './filtrosventas.component.html',
  styleUrl: './filtrosventas.component.scss'
})
export class FiltrosventasComponent implements OnInit, OnChanges {

  @Input() obj_filtros!: MonitorOperacionesFiltros;
  alConsultar = output<any>();

  @ViewChild(ComboArticuloComponent) comboArticuloRef!: ComboArticuloComponent;
  @ViewChild(ComboClienteComponent) comboClienteRef!: ComboClienteComponent;

  tiposDocumentoDisponibles = TIPOS_DOCUMENTO_OPCIONES;

  // Sucursal / Cajas
  list_sucursal: SucursalXCajas[] = [];
  list_cajas: CajaCombo[] = [];
  SelectSucursalControl = new FormControl<SucursalXCajas | null>(null);
  SelectCajaControl = new FormControl<CajaCombo | null | 'TODOS'>('TODOS');

  // Documento: mismo patron que Caja (single-select con "TODOS" por defecto).
  // Al backend, "TODOS" viaja como array vacio (sin filtro) - necesario porque
  // ventas historicas con documento mal guardado (bug 'venta' literal) no
  // matchean ningun clase_docum real y quedarian ocultas si el default fuera
  // "Factura" preseleccionado en vez de "TODOS".
  SelectDocumentoControl = new FormControl<string>('TODOS');
  SoloConDescuentoControl = new FormControl<boolean>(false);

  // Articulos seleccionados (tab "Articulos")
  articulosSeleccionados: ArticuloSearch[] = [];
  columnasArticulos: string[] = ['codArticulo', 'nomArticulo', 'acciones'];

  // Clientes seleccionados (tab "Clientes")
  clientesSeleccionados: ClienteSearch[] = [];
  columnasClientes: string[] = ['codTit', 'nombreCompleto', 'acciones'];

  filtro = signal({
    id_sucursal: 0,
    id_caja: 0,
    fechaInicio: new Date() as any,
    fechaFin: new Date() as any,
    tiposDocumento: [] as string[],
    soloConDescuento: false,
    articulos: [] as number[],
    clientes: [] as number[]
  });

  ngOnInit(): void {
    this.SelectSucursalControl.valueChanges.subscribe(sucursal => {
      this.list_cajas = sucursal?.cajas || [];
      this.filtro.update(f => ({ ...f, id_sucursal: sucursal?.id ?? 0 }));
      // Al cambiar de sucursal reiniciamos la caja elegida
      this.SelectCajaControl.setValue('TODOS');
    });

    this.SelectCajaControl.valueChanges.subscribe(caja => {
      if (caja && typeof caja === 'object') {
        this.filtro.update(f => ({ ...f, id_caja: caja.idCaja ?? 0 }));
      } else {
        this.filtro.update(f => ({ ...f, id_caja: 0 }));
      }
    });

    this.SelectDocumentoControl.valueChanges.subscribe(tipo => {
      const tiposParaBackend = (tipo && tipo !== 'TODOS') ? [tipo] : [];
      this.filtro.update(f => ({ ...f, tiposDocumento: tiposParaBackend }));
    });

    this.SoloConDescuentoControl.valueChanges.subscribe(activo => {
      this.filtro.update(f => ({ ...f, soloConDescuento: !!activo }));
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['obj_filtros'] && this.obj_filtros) {
      this.list_sucursal = this.obj_filtros.listsucursales || [];
      // La sucursal arranca en la primera de la lista para que el combo de Cajas se cargue solo
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

  agregarCliente(cliente: ClienteSearch) {
    if (cliente) {
      const yaExiste = this.clientesSeleccionados.some(c => c.idCliente === cliente.idCliente);
      if (!yaExiste) {
        this.clientesSeleccionados = [...this.clientesSeleccionados, cliente];
        this.filtro.update(f => ({ ...f, clientes: this.clientesSeleccionados.map(c => c.idCliente!) }));
      }
    }
    this.comboClienteRef?.resetCampo();
  }

  quitarCliente(cliente: ClienteSearch) {
    this.clientesSeleccionados = this.clientesSeleccionados.filter(c => c.idCliente !== cliente.idCliente);
    this.filtro.update(f => ({ ...f, clientes: this.clientesSeleccionados.map(c => c.idCliente!) }));
  }
}
