import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { Bodega } from '../../../core/models/Bodega/Bodega';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BodegaService } from '../../../core/services/Bodega/bodega.service';
import { BodegaListStateService } from '../../../core/services/Bodega/bodega-list-state.service';
import { BodegaListView } from '../../../core/interfaces/Bodega/BodegaListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'bodegas',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './bodegas.component.html',
  styleUrl: './bodegas.component.scss'
})
export class BodegasComponent {

  //Paginador
  lista_bodegas: BodegaListView[] = [];
  dataSource!: MatTableDataSource<BodegaListView>;
  Columnas: string[] = ['codigo', 'nombre', 'bprincipal', 'activo', 'fecha', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por codigo o nombre en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: BodegaService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: BodegaListStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarBodegasPaginadas();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarBodegasPaginadas();
    });
  }

  // 1. Método para cargar datos con paginación
  cargarBodegasPaginadas() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    // Llama al servicio con los parámetros actuales
    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {

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

  visualizarBodega(id: number): void {
    // Navega a '/categoria/edit/5' si el ID es 5
    console.log("Entro a editar");
    console.log(id);
    this.router.navigate(['/bodegas/view', id]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarBodega(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar bodega',
        mensaje: '¿Seguro que deseas eliminar esta bodega? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(data => {
        this.lista_bodegas = this.lista_bodegas.filter(bodega => bodega.id !== id);
        this.dataSource = new MatTableDataSource<BodegaListView>(this.lista_bodegas);
        this.notificacion.showSuccess('Bodega Eliminada con exito!');
      });
    });
  }


}
