import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { TrasladoBodegasView } from '../../../core/interfaces/Bodega/TrasladoBodegasView';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TrasladoBodegaService } from '../../../core/services/Bodega/traslado-bodega.service';
import { TrasladoListStateService } from '../../../core/services/Bodega/traslado-list-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'traslado-bodegas',
  imports: [modules_depencias, RouterModule, MatTooltipModule, ReactiveFormsModule],
  templateUrl: './traslado-bodegas.component.html',
  styleUrl: './traslado-bodegas.component.scss'
})
export class TrasladoBodegasComponent {

  //Paginador
  lista_traslados: TrasladoBodegasView[] = [];
  dataSource!: MatTableDataSource<TrasladoBodegasView>;
  Columnas: string[] = ['codigo', 'fecha', 'bodegaOrigen', 'bodegaDestino', 'obs', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por numero de documento u observacion en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: TrasladoBodegaService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: TrasladoListStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarTrasladosPaginadas();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarTrasladosPaginadas();
    });
  }

  // 1. Método para cargar datos con paginación
  cargarTrasladosPaginadas() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    // Llama al servicio con los parámetros actuales
    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {

      // Mapea la respuesta Page
      this.lista_traslados = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<TrasladoBodegasView>(this.lista_traslados);
    });
  }

  // 2. Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarTrasladosPaginadas(); // Llama al API con los nuevos parámetros
  }

  visualizarTraslado(id: number): void {
    this.router.navigate(['/trasladobodega/view', id]);
  }

  editarTraslado(id: number): void {
    this.router.navigate(['/trasladobodega/edit', id]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarTraslado(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar traslado entre bodegas',
        mensaje: '¿Seguro que deseas eliminar este traslado? Se revertirá su impacto en el stock de origen y destino y no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(data => {
        this.lista_traslados = this.lista_traslados.filter(traslado => traslado.idTrans !== id);
        this.dataSource = new MatTableDataSource<TrasladoBodegasView>(this.lista_traslados);
        this.notificacion.showSuccess('Traslado eliminado con exito!');
      });
    });
  }

}
