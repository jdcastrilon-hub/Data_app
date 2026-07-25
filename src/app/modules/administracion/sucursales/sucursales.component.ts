import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SucursalView } from 'src/app/core/interfaces/Core/SucursalView';
import { SucursalServiceService } from 'src/app/core/services/General/sucursal-service.service';
import { SucursalListStateService } from 'src/app/core/services/core/sucursal-list-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-sucursales',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.scss'
})
export class SucursalesComponent {

  //Paginador
  lista_sucursales: SucursalView[] = [];
  dataSource!: MatTableDataSource<SucursalView>;
  todasLasColumnas: string[] = ['id', 'codigo', 'nombre', 'activo', 'fecha', 'actions'];
  displayedColumns: string[] = [];

  //Buscador (filtra por codigo o nombre en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: SucursalServiceService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: SucursalListStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarSucursalesPaginadas();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');

    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarSucursalesPaginadas();
    });
  }

  cargarSucursalesPaginadas() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_sucursales = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<SucursalView>(this.lista_sucursales);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarSucursalesPaginadas();
  }

  editarSucursal(id: number): void {
    this.router.navigate(['/sucursales/edit', id]);
  }

  visualizarSucursal(id: number): void {
    this.router.navigate(['/sucursales/view', id]);
  }

  eliminarSucursal(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar sucursal',
        mensaje: '¿Seguro que deseas eliminar esta sucursal? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe({
        next: () => {
          this.notificacion.showSuccess('Sucursal eliminada con exito!');
          this.cargarSucursalesPaginadas();
        },
        error: (err) => {
          this.notificacion.showError(err.error?.message || 'No se pudo eliminar la sucursal.');
        }
      });
    });
  }

}
