import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MediospagoService } from 'src/app/core/services/Ventas/mediospago.service';
import { MediospagoListStateService } from 'src/app/core/services/Ventas/mediospago-list-state.service';
import { MediospagoListView } from 'src/app/core/interfaces/Comercial/MediospagoListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-mediospago',
  imports: [modules_depencias, RouterModule, FlexLayoutModule, ReactiveFormsModule],
  templateUrl: './mediospago.component.html',
  styleUrl: './mediospago.component.scss'
})
export class MediospagoComponent {

  //Paginador
  lista_mediospago: MediospagoListView[] = [];
  dataSource!: MatTableDataSource<MediospagoListView>;
  todasLasColumnas: string[] = ['id', 'tipo', 'orden', 'fecha', 'actions'];
  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por tipo en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: MediospagoService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: MediospagoListStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarMediosPaginados();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarMediosPaginados();
    });
  }

  cargarMediosPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_mediospago = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<MediospagoListView>(this.lista_mediospago);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarMediosPaginados();
  }

  editarMedioPago(id: number): void {
    this.router.navigate(['/mediospago/edit', id]);
  }

  visualizarMedioPago(id: number): void {
    this.router.navigate(['/mediospago/view', id]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarMedioPago(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar medio de pago',
        mensaje: '¿Seguro que deseas eliminar este medio de pago? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(() => {
        this.notificacion.showSuccess('Medio de pago eliminado con exito!');
        this.cargarMediosPaginados();
      });
    });
  }
}
