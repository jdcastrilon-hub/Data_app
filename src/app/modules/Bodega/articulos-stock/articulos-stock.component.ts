import { Component, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { ArticuloListView } from 'src/app/core/interfaces/Bodega/ArticuloListView';
import { ArticuloServiceService } from 'src/app/core/services/Bodega/articulo-service.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { modules_depencias } from '../../dependencias/modules_depencias.module';

@Component({
  selector: 'app-articulos-stock',
  imports: [modules_depencias, RouterModule],
  templateUrl: './articulos-stock.component.html',
  styleUrl: './articulos-stock.component.scss'
})
export class ArticulosStockComponent {

  //Paginador
  list_articulos: ArticuloListView[] = [];
  dataSource!: MatTableDataSource<ArticuloListView>;
  Columnas: string[] = ['codigo', 'nombre', 'negocio', 'categoria', 'subcategoria', 'activo', 'actions'];

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: ArticuloServiceService,
    private notificacion: NotificacionesService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarArticulosPaginadas();
    console.log(this.list_articulos);
  }

  // 1. Método para cargar datos con paginación
  cargarArticulosPaginadas() {
    console.log(`Cargando página: ${this.paginaActual}, tamaño: ${this.pageSize}`);

    // Llama al servicio con los parámetros actuales
    this.service.listPaginacion(this.paginaActual, this.pageSize).subscribe(data => {

      // Mapea la respuesta Page
      this.list_articulos = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<ArticuloListView>(this.list_articulos);
    });
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarArticulosPaginadas(); // Llama al API con los nuevos parámetros
  }


  //Edicion del registro
  editarArticulo(id: number): void {
    // Navega a '/categoria/edit/5' si el ID es 5
    console.log("Entro a editar");
    console.log(id);
    this.router.navigate(['/articulos/edit', id]);

  }

  //Eliminar registro
  eliminarArticulo(id: number): void {
    console.log("Entro a elininar");
    console.log(id);
    /*this.service.delete(id).subscribe(data => {
      this.lista_bodegas = this.lista_bodegas.filter(bodega => bodega.id !== id);
      this.dataSource = new MatTableDataSource<BodegaListView>(this.lista_bodegas);
      this.notificacion.showSuccess('Bodega Eliminada con exito!');
    });
    */
  }

}
