import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { UnidadServiceService } from '../../../core/services/Bodega/unidad-service.service';
import { UnidadListView } from '../../../core/interfaces/Bodega/UnidadListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'unidadesStock',
  imports: [modules_depencias, RouterModule],
  templateUrl: './unidadesStock.component.html',
  styleUrl: './unidadesStock.component.scss'
})
export class UnidadesStockComponent {

  //Paginador
  lista_unidades: UnidadListView[] = [];
  dataSource!: MatTableDataSource<UnidadListView>;
  Columnas: string[] = ['codigo', 'nombre', 'espaquete', 'conversion', 'fecha', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: UnidadServiceService,
    private notificacion: NotificacionesService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.cargarUnidadesPaginadas();
  }

  // 1. Método para cargar datos con paginación
  cargarUnidadesPaginadas() {
    this.service.listPaginacion(this.paginaActual, this.pageSize).subscribe(data => {
      this.lista_unidades = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<UnidadListView>(this.lista_unidades);
    });
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarUnidadesPaginadas();
  }

  //Edicion del registro
  editarUnidad(id: number): void {
    this.router.navigate(['/unidades/edit', id]);
  }

  visualizarUnidad(id: number): void {
    this.router.navigate(['/unidades/view', id]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarUnidad(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar unidad',
        mensaje: '¿Seguro que deseas eliminar esta unidad? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(data => {
        this.lista_unidades = this.lista_unidades.filter(unidad => unidad.id !== id);
        this.dataSource = new MatTableDataSource<UnidadListView>(this.lista_unidades);
        this.notificacion.showSuccess('Unidad eliminada con exito!');
      });
    });
  }

}
