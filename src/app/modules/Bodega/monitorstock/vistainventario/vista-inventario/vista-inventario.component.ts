import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
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
import { MonitorStockDisponibleVista1 } from 'src/app/core/interfaces/Bodega/MonitorStockDisponibleVista1';
import { MonitorstockService } from 'src/app/core/services/Bodega/monitorstock.service';
import { ModalMovimientosComponent } from '../modal-movimientos/modal-movimientos.component';

const STORAGE_KEY_COLUMNAS = 'monitorstock_vistainventario_columnas';

@Component({
  selector: 'vistainventario',
  standalone: true,
  imports: [CommonModule, MatTableModule, FlexLayoutModule, MatPaginatorModule, MatIconModule, MatTooltipModule, MatButtonModule, MatMenuModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './vista-inventario.component.html',
  styleUrl: './vista-inventario.component.scss'
})
export class VistaInventarioComponent {

// Aquí recibimos la información del padre
  @Input() datos: any[] = [];
  @Input() totalRegistros: number = 0; // Total que viene del API (ej: 500 filas)
  @Input() pageSize: number = 5; // Total que viene del API (ej: 500 filas)
  @Input() filtrosActuales: any;
  @Output() paginacion = new EventEmitter<PageEvent>();

  exportando = false;

  // Columnas que el usuario puede mostrar/ocultar (position y acciones siempre se ven)
  columnasConfigurables: { clave: string, label: string }[] = [
    { clave: 'negocio', label: 'Negocio' },
    { clave: 'bodega', label: 'Bodega' },
    { clave: 'categoria', label: 'Categoria' },
    { clave: 'subcategoria', label: 'Sub Categoria' },
    { clave: 'articulo', label: 'Articulo' },
    { clave: 'nombre', label: 'Descripcion' },
    { clave: 'codbarra', label: 'Código de Barra' },
    { clave: 'unidad', label: 'Unidad' },
    { clave: 'cantidad', label: 'Cantidad' },
  ];
  columnasVisibles: Set<string> = new Set(this.columnasConfigurables.map(c => c.clave));

  displayedColumns: string[] = [];
  pageSizeOptions: number[] = [50, 100, 200, 300];
  //datasource
  dataSource!: MatTableDataSource<MonitorStockDisponibleVista1>;

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(private dialog: MatDialog, private service: MonitorstockService) { }

  ngOnInit() {
    this.cargarColumnasGuardadas();
    this.ValidarColumnas();
    // Solo inicializamos el objeto
    this.dataSource = new MatTableDataSource<MonitorStockDisponibleVista1>([]);
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

      console.log("Datos actualizados en el dataSource:", this.dataSource.data.length);
    }
  }

  cambioPagina(event: PageEvent) {
    console.log("cambioPagina")
    this.paginacion.emit(event);
  }

  exportarExcel(): void {
    this.exportando = true;
    this.service.exportarInventario(this.filtrosActuales || {}).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'inventario.xlsx';
        enlace.click();
        window.URL.revokeObjectURL(url);
        this.exportando = false;
      },
      error: (err) => {
        console.error('Error exportando inventario', err);
        this.exportando = false;
      }
    });
  }

  abrirMovimientos(articulo: MonitorStockDisponibleVista1): void {
    this.dialog.open(ModalMovimientosComponent, {
      width: '70%',
      data: {
        idArticulo: articulo.idarticulo,
        idCodBarra: articulo.idcodbarra,
        codArticulo: articulo.codarticulo,
        nomArticulo: articulo.nomarticulo,
        codBarra: articulo.codbarra
      }
    });
  }

}
 