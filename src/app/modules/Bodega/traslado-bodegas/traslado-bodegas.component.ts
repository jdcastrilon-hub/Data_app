import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { RouterModule } from '@angular/router';
import { TrasladoBodegas } from '../../../core/models/Bodega/TrasladoBodegas';
import { TrasladoBodegasView } from '../../../core/interfaces/Bodega/TrasladoBodegasView';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { TrasladoBodegaService } from '../../../core/services/Bodega/traslado-bodega.service';

@Component({
  selector: 'traslado-bodegas',
  imports: [modules_depencias, RouterModule],
  templateUrl: './traslado-bodegas.component.html',
  styleUrl: './traslado-bodegas.component.scss'
})
export class TrasladoBodegasComponent {

  //Objecto Transaccional
  objecto_traslado!: TrasladoBodegas;

  //Paginador
  lista_bodegas: TrasladoBodegasView[] = [];
  dataSource!: MatTableDataSource<TrasladoBodegasView>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(private service: TrasladoBodegaService) { }

  ngOnInit() {
    this.cargarTrasladosPaginadas();
  }

  // 1. Método para cargar datos con paginación
  cargarTrasladosPaginadas() {
    console.log(`Cargando página: ${this.paginaActual}, tamaño: ${this.pageSize}`);

    // Llama al servicio con los parámetros actuales
    this.service.listPaginacion(this.paginaActual, this.pageSize).subscribe(data => {

      // Mapea la respuesta Page
      this.lista_bodegas = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<TrasladoBodegasView>(this.lista_bodegas);
    });
  }

  // 2. Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarTrasladosPaginadas(); // Llama al API con los nuevos parámetros
  }

}
