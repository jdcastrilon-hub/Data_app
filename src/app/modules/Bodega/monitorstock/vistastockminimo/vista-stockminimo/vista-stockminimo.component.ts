import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StockMinimoDisponible } from 'src/app/core/interfaces/Bodega/StockMinimoDisponible';
import { MonitorstockService } from 'src/app/core/services/Bodega/monitorstock.service';

const STORAGE_KEY_COLUMNAS = 'monitorstock_vistastockminimo_columnas';

@Component({
  selector: 'vistastockminimo',
  standalone: true,
  imports: [CommonModule, MatTableModule, FlexLayoutModule, MatPaginatorModule, MatIconModule, MatTooltipModule, MatButtonModule, MatMenuModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './vista-stockminimo.component.html',
  styleUrl: './vista-stockminimo.component.scss'
})
export class VistaStockminimoComponent {

  @Input() datos: any[] = [];
  @Input() totalRegistros: number = 0;
  @Input() pageSize: number = 5;
  @Input() filtrosActuales: any;
  @Output() paginacion = new EventEmitter<PageEvent>();

  exportando = false;

  // Columnas que el usuario puede mostrar/ocultar (position siempre se ve)
  columnasConfigurables: { clave: string, label: string }[] = [
    { clave: 'negocio', label: 'Negocio' },
    { clave: 'categoria', label: 'Categoria' },
    { clave: 'subcategoria', label: 'Sub Categoria' },
    { clave: 'articulo', label: 'Articulo' },
    { clave: 'nombre', label: 'Descripcion' },
    { clave: 'unidad', label: 'Unidad' },
    { clave: 'cantidaddisponible', label: 'Cantidad Disponible' },
    { clave: 'stockminimo', label: 'Stock Minimo' },
    { clave: 'stockmaximo', label: 'Stock Maximo' },
    { clave: 'faltante', label: 'Faltante' },
  ];
  columnasVisibles: Set<string> = new Set(this.columnasConfigurables.map(c => c.clave));

  displayedColumns: string[] = [];
  pageSizeOptions: number[] = [50, 100, 200, 300];
  dataSource!: MatTableDataSource<StockMinimoDisponible>;

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(private service: MonitorstockService) { }

  ngOnInit() {
    this.cargarColumnasGuardadas();
    this.ValidarColumnas();
    this.dataSource = new MatTableDataSource<StockMinimoDisponible>([]);
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

  exportarExcel(): void {
    this.exportando = true;
    this.service.exportarStockMinimo(this.filtrosActuales || {}).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'stock_minimo.xlsx';
        enlace.click();
        window.URL.revokeObjectURL(url);
        this.exportando = false;
      },
      error: (err) => {
        console.error('Error exportando stock minimo', err);
        this.exportando = false;
      }
    });
  }

}
