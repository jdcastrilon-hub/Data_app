import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MonitorDetalleVentasRealizadas } from 'src/app/core/interfaces/Comercial/MonitorDetalleVentasRealizadas';

const STORAGE_KEY_COLUMNAS = 'monitoroperaciones_vistaventas_columnas';

@Component({
  selector: 'vistaventasrealizadas',
  standalone: true,
  imports: [CommonModule, MatTableModule, FlexLayoutModule, MatPaginatorModule, MatIconModule, MatTooltipModule, MatButtonModule, MatMenuModule, MatCheckboxModule],
  templateUrl: './vistaventasrealizadas.component.html',
  styleUrl: './vistaventasrealizadas.component.scss'
})
export class VistaventasrealizadasComponent implements OnChanges {

  @Input() datos: any[] = [];
  @Input() totalRegistros: number = 0;
  @Input() pageSize: number = 5;
  @Input() filtrosActuales: any;
  @Output() paginacion = new EventEmitter<PageEvent>();

  // Columnas que el usuario puede mostrar/ocultar (position siempre se ve)
  columnasConfigurables: { clave: string, label: string }[] = [
    { clave: 'sucursal', label: 'Sucursal' },
    { clave: 'documento', label: 'Documento' },
    { clave: 'factura', label: 'Factura' },
    { clave: 'fecha', label: 'Fecha' },
    { clave: 'cliente', label: 'Cliente' },
    { clave: 'caja', label: 'Caja' },
    { clave: 'importe', label: 'Importe' },
  ];
  columnasVisibles: Set<string> = new Set(this.columnasConfigurables.map(c => c.clave));

  displayedColumns: string[] = [];
  pageSizeOptions: number[] = [50, 100, 200, 300];
  dataSource!: MatTableDataSource<MonitorDetalleVentasRealizadas>;

  @ViewChild(MatTable) table!: MatTable<any>;

  ngOnInit() {
    this.cargarColumnasGuardadas();
    this.ValidarColumnas();
    this.dataSource = new MatTableDataSource<MonitorDetalleVentasRealizadas>([]);
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
    this.displayedColumns = ['position', ...configurablesVisibles];
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
}
