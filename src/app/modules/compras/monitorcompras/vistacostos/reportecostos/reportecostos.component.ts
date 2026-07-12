import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MonitorCompraReporteCostosDetalle } from 'src/app/core/interfaces/Compras/MonitorCompraReporteCostosDetalle';
import { AjustecostoComponent } from '../ajustecosto/ajustecosto.component';
import { MatIconModule } from '@angular/material/icon'
import { MatDialog } from '@angular/material/dialog';
import { AjusteCostos } from 'src/app/core/models/Compras/AjusteCostos';
import { MonitorcomprasService } from 'src/app/core/services/Compras/monitorcompras.service';

const STORAGE_KEY_COLUMNAS = 'monitorcompras_vistacostos_columnas';

@Component({
  selector: 'reportecostos',
  imports: [CommonModule, MatTableModule, FlexLayoutModule, MatPaginatorModule, MatIconModule, MatTooltipModule, MatButtonModule, MatMenuModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './reportecostos.component.html',
  styleUrl: './reportecostos.component.scss'
})
export class ReportecostosComponent {

  // Aquí recibimos la información del padre
  @Input() datos: any[] = [];
  @Input() totalRegistros: number = 0; // Total que viene del API (ej: 500 filas)
  @Input() pageSize: number = 5; // Total que viene del API (ej: 500 filas)
  @Input() filtrosActuales: any;
  @Output() paginacion = new EventEmitter<PageEvent>();

  exportando = false;

  // Columnas que el usuario puede mostrar/ocultar (position y accion siempre se ven)
  columnasConfigurables: { clave: string, label: string }[] = [
    { clave: 'negocio', label: 'Negocio' },
    { clave: 'bodega', label: 'Bodega' },
    { clave: 'categoria', label: 'Categoria' },
    { clave: 'subcategoria', label: 'Sub Categoria' },
    { clave: 'articulo', label: 'Articulo' },
    { clave: 'nombre', label: 'Descripcion' },
    { clave: 'costo', label: 'Costo' },
  ];
  columnasVisibles: Set<string> = new Set(this.columnasConfigurables.map(c => c.clave));

  displayedColumns: string[] = [];
  pageSizeOptions: number[] = [50, 100, 200, 300];
  //datasource
  dataSource!: MatTableDataSource<MonitorCompraReporteCostosDetalle>;

  @ViewChild(MatTable) table!: MatTable<any>;
  objeto_resultado!: AjusteCostos;


  constructor(private dialog: MatDialog, private service: MonitorcomprasService) {

  }

  ngOnInit() {
    this.cargarColumnasGuardadas();
    this.ValidarColumnas();
    // Solo inicializamos el objeto
    this.dataSource = new MatTableDataSource<MonitorCompraReporteCostosDetalle>([]);
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
    this.displayedColumns = ['position', ...configurablesVisibles, 'accion'];
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
    this.service.exportarCostos(this.filtrosActuales || {}).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'costos.xlsx';
        enlace.click();
        window.URL.revokeObjectURL(url);
        this.exportando = false;
      },
      error: (err) => {
        console.error('Error exportando costos', err);
        this.exportando = false;
      }
    });
  }

  ModalcrearCodigoBarra(index: number): void {
    // 1. Abre el diálogo, pasando el componente modal y los datos

    this.objeto_resultado = new AjusteCostos();
    const fila = this.dataSource.data.at(index);

    const dialogRef = this.dialog.open(AjustecostoComponent, {
      width: '70%', // Define el ancho del modal
      data: {
        titulo: 'AJUSTE DE COSTOS',
        mensaje: 'Este mensaje fue enviado desde el componente principal.',
        objecto_modal: fila
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.objeto_resultado = result;

      if (this.objeto_resultado) {
        const filaActualizada = this.dataSource.data[index];
        //Actualizar validar del costo
        filaActualizada.costo = result.impCostoNuevo;
        //Actualizar datasource
        this.dataSource._updateChangeSubscription();

      }

    });

  }

}
