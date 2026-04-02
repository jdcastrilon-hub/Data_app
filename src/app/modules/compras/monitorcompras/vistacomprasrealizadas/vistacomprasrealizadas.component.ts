import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { monitorDetalleComprasRealizadas } from 'src/app/core/interfaces/Compras/monitorDetalleComprasRealizadas';

@Component({
  selector: 'vistacomprasrealizadas',
  standalone: true,
  imports: [CommonModule, MatTableModule, FlexLayoutModule,MatPaginatorModule],
  templateUrl: './vistacomprasrealizadas.component.html',
  styleUrl: './vistacomprasrealizadas.component.scss'
})
export class VistacomprasrealizadasComponent implements OnChanges {

  // Aquí recibimos la información del padre
  @Input() datos: any[] = [];
  @Input() totalRegistros: number = 0; // Total que viene del API (ej: 500 filas)
  @Input() pageSize: number = 5; // Total que viene del API (ej: 500 filas)
  @Output() paginacion = new EventEmitter<PageEvent>();

  // Definimos las columnas que queremos mostrar en Matrix
  todasLasColumnas: string[] = ['id','position','fecha', 'proveedor', 'numoc', 'remito', 'bodega', 'importe', 'actions'];
  displayedColumns: string[] = [];
  pageSizeOptions: number[] = [50, 100, 200, 300];
  //datasource
  dataSource!: MatTableDataSource<monitorDetalleComprasRealizadas>;

  @ViewChild(MatTable) table!: MatTable<any>;

  ngOnInit() {
    this.ValidarColumnas();
    // Solo inicializamos el objeto
    this.dataSource = new MatTableDataSource<monitorDetalleComprasRealizadas>([]);
  }

  ValidarColumnas() {
    //this.displayedColumns = this.todasLasColumnas;
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');
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

}
 