import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { Bodega } from '../../../core/models/Bodega/Bodega';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { BodegaService } from '../../../core/services/Bodega/bodega.service';
import { BodegaListView } from '../../../core/interfaces/Bodega/BodegaListView';


@Component({
  selector: 'bodegas',
  imports: [modules_depencias, RouterModule],
  templateUrl: './bodegas.component.html',
  styleUrl: './bodegas.component.scss'
})
export class BodegasComponent {

  //Objecto Transaccional
  objecto_bodega!: Bodega;

  //Paginador
  lista_bodegas: BodegaListView[] = [];
  dataSource!: MatTableDataSource<BodegaListView>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: BodegaService,
    private router: Router
  ) {
    this.objecto_bodega = new Bodega();
  }

  ngOnInit() {
    this.cargarBodegasPaginadas();
    console.log(this.lista_bodegas);
  }

  // 1. Método para cargar datos con paginación
  cargarBodegasPaginadas() {
    console.log(`Cargando página: ${this.paginaActual}, tamaño: ${this.pageSize}`);

    // Llama al servicio con los parámetros actuales
    this.service.listPaginacion(this.paginaActual, this.pageSize).subscribe(data => {

      // Mapea la respuesta Page
      this.lista_bodegas = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<BodegaListView>(this.lista_bodegas);
    });
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarBodegasPaginadas(); // Llama al API con los nuevos parámetros
  }

  //Edicion del registro
  editarBodega(id: number): void {
    // Navega a '/categoria/edit/5' si el ID es 5
    console.log("Entro a editar");
    console.log(id);
    this.router.navigate(['/bodegas/edit', id]);
      
  }


}
