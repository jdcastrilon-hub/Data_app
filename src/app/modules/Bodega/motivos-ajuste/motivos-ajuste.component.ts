import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MotivoAjusteView } from '../../../core/models/Bodega/MotivoAjusteView';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MotivosAjusteService } from '../../../core/services/Bodega/motivos-ajuste.service';

@Component({
  selector: 'motivos-ajuste',
  imports: [modules_depencias, RouterModule],
  templateUrl: './motivos-ajuste.component.html',
  styleUrl: './motivos-ajuste.component.scss'
})
export class MotivosAjusteComponent {

  //Paginador
  lista_motivos: MotivoAjusteView[] = [];
  dataSource!: MatTableDataSource<MotivoAjusteView>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(private service: MotivosAjusteService,
    private router: Router
  ) {
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
      this.lista_motivos = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<MotivoAjusteView>(this.lista_motivos);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarCategoriasPaginadas(); // Llama al API con los nuevos parámetros
  }

}
