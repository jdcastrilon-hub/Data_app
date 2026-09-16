import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MovimientoTesoreria } from 'src/app/core/interfaces/Tesoreria/MovimientoTesoreria';
import { MonitortesoreriaService } from 'src/app/core/services/Tesoreria/monitortesoreria.service';

const STORAGE_KEY_COLUMNAS = 'monitortesoreria_vistamovimientos_columnas';

@Component({
  selector: 'vista-movimientos',
  standalone: true,
  imports: [CommonModule, MatTableModule, FlexLayoutModule, MatPaginatorModule, MatIconModule, MatTooltipModule,
    MatButtonModule, MatMenuModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './vista-movimientos.component.html',
  styleUrl: './vista-movimientos.component.scss'
})
export class VistaMovimientosComponent implements OnInit, OnChanges {

  @Input() datos: MovimientoTesoreria[] = [];
  @Input() totalRegistros: number = 0;
  @Input() pageSize: number = 10;
  @Input() filtrosActuales: any;
  @Output() paginacion = new EventEmitter<PageEvent>();

  exportando = false;

  columnasConfigurables: { clave: string, label: string }[] = [
    { clave: 'fecha', label: 'Fecha' },
    { clave: 'tipoCuenta', label: 'Tipo' },
    { clave: 'cuenta', label: 'Cuenta' },
    { clave: 'mediopago', label: 'Medio de Pago' },
    { clave: 'concepto', label: 'Concepto' },
    { clave: 'vista', label: 'Vista' },
  ];
  columnasVisibles: Set<string> = new Set(this.columnasConfigurables.map(c => c.clave));

  displayedColumns: string[] = [];
  pageSizeOptions: number[] = [10, 25, 50, 100];
  dataSource!: MatTableDataSource<MovimientoTesoreria>;

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(private service: MonitortesoreriaService) { }

  ngOnInit() {
    this.cargarColumnasGuardadas();
    this.validarColumnas();
    this.dataSource = new MatTableDataSource<MovimientoTesoreria>([]);
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
    this.validarColumnas();
  }

  validarColumnas() {
    const configurablesVisibles = this.columnasConfigurables
      .map(c => c.clave)
      .filter(clave => this.columnasVisibles.has(clave));
    this.displayedColumns = ['position', ...configurablesVisibles, 'importe'];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datos'] && this.dataSource) {
      this.dataSource.data = this.datos || [];
      if (this.table) {
        this.table.renderRows();
      }
    }
  }

  cambioPagina(event: PageEvent) {
    this.paginacion.emit(event);
  }

  nombreCuenta(el: MovimientoTesoreria): string {
    return el.tipoCuenta === 'CAJA' ? (el.nomCaja || '') : (el.nomBanco || '');
  }

  exportarExcel(): void {
    this.exportando = true;
    this.service.exportarMovimientos(this.filtrosActuales || {}).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'movimientos_tesoreria.xlsx';
        enlace.click();
        window.URL.revokeObjectURL(url);
        this.exportando = false;
      },
      error: (err) => {
        console.error('Error exportando movimientos', err);
        this.exportando = false;
      }
    });
  }
}
