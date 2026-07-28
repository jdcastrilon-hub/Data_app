import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MotivoDevolucionView } from '../../../core/models/Compras/MotivoDevolucionView';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MotivosDevolucionService } from '../../../core/services/Compras/motivos-devolucion.service';
import { MotivoDevolucionListStateService } from '../../../core/services/Compras/motivo-devolucion-list-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'motivos-devolucion',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './motivos-devolucion.component.html',
  styleUrl: './motivos-devolucion.component.scss'
})
export class MotivosDevolucionComponent {

  //Paginador
  lista_motivos: MotivoDevolucionView[] = [];
  dataSource!: MatTableDataSource<MotivoDevolucionView>;
  Columnas: string[] = ['id', 'name', 'estado', 'fecha', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por codigo o nombre en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: MotivosDevolucionService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: MotivoDevolucionListStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarMotivosPaginados();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarMotivosPaginados();
    });
  }

  // 1. Método para cargar datos con paginación
  cargarMotivosPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_motivos = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<MotivoDevolucionView>(this.lista_motivos);
    });
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarMotivosPaginados();
  }

  //Edicion del registro
  editarMotivo(id: number): void {
    this.router.navigate(['/motivosdevolucion/edit', id]);
  }

  visualizarMotivo(id: number): void {
    this.router.navigate(['/motivosdevolucion/view', id]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarMotivo(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar motivo',
        mensaje: '¿Seguro que deseas eliminar este motivo? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(() => {
        this.notificacion.showSuccess('Motivo eliminado con exito!');
        this.cargarMotivosPaginados();
      });
    });
  }

}
