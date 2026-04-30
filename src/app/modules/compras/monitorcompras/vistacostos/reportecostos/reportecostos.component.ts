import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MonitorCompraReporteCostosDetalle } from 'src/app/core/interfaces/Compras/MonitorCompraReporteCostosDetalle';
import { AjustecostoComponent } from '../ajustecosto/ajustecosto.component';
import { MatIconModule } from '@angular/material/icon'
import { MatDialog } from '@angular/material/dialog';
import { AjusteCostos } from 'src/app/core/models/Compras/AjusteCostos';

@Component({
  selector: 'reportecostos',
  imports: [CommonModule, MatTableModule, FlexLayoutModule, MatPaginatorModule, MatIconModule],
  templateUrl: './reportecostos.component.html',
  styleUrl: './reportecostos.component.scss'
})
export class ReportecostosComponent {

  // Aquí recibimos la información del padre
  @Input() datos: any[] = [];
  @Input() totalRegistros: number = 0; // Total que viene del API (ej: 500 filas)
  @Input() pageSize: number = 5; // Total que viene del API (ej: 500 filas)
  @Output() paginacion = new EventEmitter<PageEvent>();

  // Definimos las columnas que queremos mostrar en Matrix
  todasLasColumnas: string[] = ['position', 'negocio', 'bodega', 'categoria', 'subcategoria', 'articulo', 'nombre', 'costo', 'accion'];
  displayedColumns: string[] = [];
  pageSizeOptions: number[] = [50, 100, 200, 300];
  //datasource
  dataSource!: MatTableDataSource<MonitorCompraReporteCostosDetalle>;

  @ViewChild(MatTable) table!: MatTable<any>;
  objeto_resultado!: AjusteCostos;


  constructor(private dialog: MatDialog) {

  }

  ngOnInit() {
    this.ValidarColumnas();
    // Solo inicializamos el objeto
    this.dataSource = new MatTableDataSource<MonitorCompraReporteCostosDetalle>([]);
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
    console.log("fin modal");
    console.log(this.objeto_resultado);


    dialogRef.afterClosed().subscribe(result => {
      console.log('El modal se cerró con el resultado:', result);

      // 'result' contendrá 'Resultado Confirmado' o 'undefined' (si se cerró con 'Cancelar')
      //this.resultadoModal = result || 'Cancelado por el usuario o cerrado por ESC';
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
