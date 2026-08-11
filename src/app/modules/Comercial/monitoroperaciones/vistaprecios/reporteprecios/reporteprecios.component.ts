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
import { MonitorVentaReportePreciosDetalle } from 'src/app/core/interfaces/Comercial/MonitorVentaReportePreciosDetalle';
import { AjusteprecioComponent } from '../ajusteprecio/ajusteprecio.component';
import { ModalHistorialPrecioComponent } from '../modal-historial-precio/modal-historial-precio.component';
import { MatIconModule } from '@angular/material/icon'
import { MatDialog } from '@angular/material/dialog';
import { AjustePrecio } from 'src/app/core/models/Ventas/AjustePrecio';
import { MonitoroperacionesService } from 'src/app/core/services/Ventas/monitoroperaciones.service';

const STORAGE_KEY_COLUMNAS = 'monitoroperaciones_vistaprecios_columnas';

@Component({
  selector: 'reporteprecios',
  imports: [CommonModule, MatTableModule, FlexLayoutModule, MatPaginatorModule, MatIconModule, MatTooltipModule, MatButtonModule, MatMenuModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './reporteprecios.component.html',
  styleUrl: './reporteprecios.component.scss'
})
export class ReporteprecioComponent {

  @Input() datos: any[] = [];
  @Input() totalRegistros: number = 0;
  @Input() pageSize: number = 5;
  @Input() filtrosActuales: any;
  @Output() paginacion = new EventEmitter<PageEvent>();

  exportando = false;

  columnasConfigurables: { clave: string, label: string }[] = [
    { clave: 'negocio', label: 'Negocio' },
    { clave: 'lista', label: 'Lista' },
    { clave: 'categoria', label: 'Categoria' },
    { clave: 'subcategoria', label: 'Sub Categoria' },
    { clave: 'articulo', label: 'Articulo' },
    { clave: 'nombre', label: 'Descripcion' },
    { clave: 'precio', label: 'Precio' },
  ];
  columnasVisibles: Set<string> = new Set(this.columnasConfigurables.map(c => c.clave));

  displayedColumns: string[] = [];
  pageSizeOptions: number[] = [50, 100, 200, 300];
  dataSource!: MatTableDataSource<MonitorVentaReportePreciosDetalle>;

  @ViewChild(MatTable) table!: MatTable<any>;
  objeto_resultado!: AjustePrecio;

  constructor(private dialog: MatDialog, private service: MonitoroperacionesService) { }

  ngOnInit() {
    this.cargarColumnasGuardadas();
    this.ValidarColumnas();
    this.dataSource = new MatTableDataSource<MonitorVentaReportePreciosDetalle>([]);
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
    this.service.exportarPrecios(this.filtrosActuales || {}).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'precios.xlsx';
        enlace.click();
        window.URL.revokeObjectURL(url);
        this.exportando = false;
      },
      error: (err) => {
        console.error('Error exportando precios', err);
        this.exportando = false;
      }
    });
  }

  abrirAjustePrecio(index: number): void {
    this.objeto_resultado = new AjustePrecio();
    const fila = this.dataSource.data.at(index);
    if (!fila || !fila.idlista) {
      return;
    }

    const dialogRef = this.dialog.open(AjusteprecioComponent, {
      width: '70%',
      data: {
        titulo: 'AJUSTE DE PRECIO',
        objecto_modal: fila
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.objeto_resultado = result;

      if (this.objeto_resultado) {
        const filaActualizada = this.dataSource.data[index];
        filaActualizada.precio = result.impPrecioNuevo;
        this.dataSource._updateChangeSubscription();
      }
    });
  }

  abrirHistorial(index: number): void {
    const fila = this.dataSource.data.at(index);
    if (!fila || !fila.idlista) {
      return;
    }

    this.dialog.open(ModalHistorialPrecioComponent, {
      width: '90%',
      maxWidth: '1100px',
      data: {
        idArticulo: fila.idarticulo,
        idLista: fila.idlista,
        codArticulo: fila.codarticulo,
        nomArticulo: fila.nomarticulo
      }
    });
  }

}
