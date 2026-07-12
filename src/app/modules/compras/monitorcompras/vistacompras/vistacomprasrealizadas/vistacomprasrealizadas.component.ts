import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { monitorDetalleComprasRealizadas } from 'src/app/core/interfaces/Compras/monitorDetalleComprasRealizadas';
import { MonitorcomprasService } from 'src/app/core/services/Compras/monitorcompras.service';
import { ModalDetalleCompraComponent } from '../modal-detalle-compra/modal-detalle-compra.component';

const STORAGE_KEY_COLUMNAS = 'monitorcompras_vistacompras_columnas';

@Component({
  selector: 'vistacomprasrealizadas',
  standalone: true,
  imports: [CommonModule, MatTableModule, FlexLayoutModule, MatPaginatorModule, MatIconModule, MatTooltipModule, MatButtonModule, MatMenuModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './vistacomprasrealizadas.component.html',
  styleUrl: './vistacomprasrealizadas.component.scss'
})
export class VistacomprasrealizadasComponent implements OnChanges {

  // Aquí recibimos la información del padre
  @Input() datos: any[] = [];
  @Input() totalRegistros: number = 0; // Total que viene del API (ej: 500 filas)
  @Input() pageSize: number = 5; // Total que viene del API (ej: 500 filas)
  @Input() filtrosActuales: any;
  @Output() paginacion = new EventEmitter<PageEvent>();

  exportando = false;

  // Columnas que el usuario puede mostrar/ocultar (position siempre se ve)
  columnasConfigurables: { clave: string, label: string }[] = [
    { clave: 'fecha', label: 'Fecha' },
    { clave: 'proveedor', label: 'Proveedor' },
    { clave: 'numoc', label: 'Num. OC' },
    { clave: 'remito', label: 'Remito' },
    { clave: 'bodega', label: 'Bodega' },
    { clave: 'importe', label: 'Total' },
  ];
  columnasVisibles: Set<string> = new Set(this.columnasConfigurables.map(c => c.clave));

  displayedColumns: string[] = [];
  pageSizeOptions: number[] = [50, 100, 200, 300];
  //datasource
  dataSource!: MatTableDataSource<monitorDetalleComprasRealizadas>;

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(private service: MonitorcomprasService, private dialog: MatDialog) { }

  ngOnInit() {
    this.cargarColumnasGuardadas();
    this.ValidarColumnas();
    // Solo inicializamos el objeto
    this.dataSource = new MatTableDataSource<monitorDetalleComprasRealizadas>([]);
  }

  cargarColumnasGuardadas(): void {
    const guardadas = localStorage.getItem(STORAGE_KEY_COLUMNAS);
    if (guardadas) {
      this.columnasVisibles = new Set(JSON.parse(guardadas));
    }
  }

  esVisible(clave: string): boolean {
    return this.columnasVisibles.has(clave);
  }

  toggleColumna(clave: string): void {
    if (this.columnasVisibles.has(clave)) {
      this.columnasVisibles.delete(clave);
    } else {
      this.columnasVisibles.add(clave);
    }
    localStorage.setItem(STORAGE_KEY_COLUMNAS, JSON.stringify([...this.columnasVisibles]));
    this.ValidarColumnas();
  }

  ValidarColumnas() {
    const configurablesVisibles = this.columnasConfigurables
      .map(c => c.clave)
      .filter(clave => this.columnasVisibles.has(clave));
    this.displayedColumns = ['position', ...configurablesVisibles, 'acciones'];
  }

  ngOnChanges(changes: SimpleChanges): void {
    // 1. Verificamos si los datos cambiaron
    if (changes['datos'] && this.dataSource) {
      // 2. Actualizamos la propiedad .data del dataSource
      this.dataSource.data = this.datos || [];

      // 3. (Opcional) Si usas paginación o filtros, refresca la referencia
      if (this.table) {
        this.table.renderRows();
      }
    }
  }

  cambioPagina(event: PageEvent) {
    this.paginacion.emit(event);
  }

  exportarExcel(): void {
    this.exportando = true;
    this.service.exportarComprasRealizadas(this.filtrosActuales || {}).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'compras_realizadas.xlsx';
        enlace.click();
        window.URL.revokeObjectURL(url);
        this.exportando = false;
      },
      error: (err) => {
        console.error('Error exportando compras realizadas', err);
        this.exportando = false;
      }
    });
  }

  abrirDetalle(compra: monitorDetalleComprasRealizadas): void {
    this.dialog.open(ModalDetalleCompraComponent, {
      width: '90%',
      maxWidth: '1100px',
      data: {
        idTrans: compra.id_trans,
        numoc: compra.numoc,
        remito: compra.remito
      }
    });
  }

}
