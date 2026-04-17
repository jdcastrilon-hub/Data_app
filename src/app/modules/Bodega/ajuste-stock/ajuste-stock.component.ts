import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { AjusteStockService } from '../../../core/services/Bodega/ajuste-stock.service';
import { AjusteStockListView } from '../../../core/models/Bodega/AjusteStockListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'ajuste-stock',
  imports: [modules_depencias, RouterModule,MatTooltipModule],
  templateUrl: './ajuste-stock.component.html',
  styleUrl: './ajuste-stock.component.scss'
})
export class AjusteStockComponent {

  lista_ajustes: AjusteStockListView[] = [];
  dataSource!: MatTableDataSource<AjusteStockListView>;
  Columnas: string[] = ['id', 'nrodocum', 'fecha', 'bodega', 'estado', 'motivo','obs','actions'];
  displayedColumns: string[] = [];

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: AjusteStockService,
    private notificacion: NotificacionesService,
    private router: Router
  ) { }

  ngOnInit() {
    this.CargarLista();
    this.ValidarColumnas();
  }

  CargarLista() {
    console.log("inicio refrescarTabla");
    this.service.listPaginacion(this.paginaActual, this.pageSize).subscribe(data => {
      this.lista_ajustes = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<AjusteStockListView>(this.lista_ajustes);
    });
    console.log(this.lista_ajustes.length);
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.CargarLista(); // Llama al API con los nuevos parámetros
  }

  //Edicion del registro
  visualizarAjusteStock(id: number): void {
    // Navega a '/categoria/edit/5' si el ID es 5
    console.log("Entro a editar");
    console.log(id);
    this.router.navigate(['/ajustestock/view', id]);
  }

  ValidarColumnas() {
    //this.displayedColumns = this.todasLasColumnas;
    this.displayedColumns = this.Columnas.filter(columna => columna !== 'id');
  }
}
