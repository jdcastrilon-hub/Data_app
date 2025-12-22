import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { Categoria } from '../../../core/models/Bodega/Categoria';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { CategoriaService } from '../../../core/services/Bodega/categoria-service.service';
import { Subscription } from 'rxjs';
import { CategoriaListView } from '../../../core/models/Bodega/CategoriaListView';

@Component({
  selector: 'categorias',
  imports: [modules_depencias, RouterModule],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss'
})
export class CategoriasComponent {

  //Objecto Transaccional
  objecto_categoria!: Categoria;

  //Paginador
  lista_Categorias: CategoriaListView[] = [];
  dataSource!: MatTableDataSource<CategoriaListView>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: CategoriaService,
    private router: Router
  ) {
    this.objecto_categoria = new Categoria();
  }

  ngOnInit() {
    this.cargarCategoriasPaginadas();
  }

  // 1. Método para cargar datos con paginación
  cargarCategoriasPaginadas() {
    console.log(`Cargando página: ${this.paginaActual}, tamaño: ${this.pageSize}`);

    // Llama al servicio con los parámetros actuales
    this.service.listPaginacion(this.paginaActual, this.pageSize).subscribe(data => {

      // Mapea la respuesta Page
      this.lista_Categorias = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<CategoriaListView>(this.lista_Categorias);
    });
  }

  // 2. Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarCategoriasPaginadas(); // Llama al API con los nuevos parámetros
  }

  //Edicion del registro
  editarCategoria(id: number): void {
    // Navega a '/categoria/edit/5' si el ID es 5
    console.log("Entro a editar");
    console.log(id);
    this.router.navigate(['/categoria/edit', id]);
  }
}
