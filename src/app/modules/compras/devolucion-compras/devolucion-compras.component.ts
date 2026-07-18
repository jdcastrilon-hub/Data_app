import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DevolucionComprasService } from 'src/app/core/services/Compras/devolucion-compras.service';
import { DevolucionListStateService } from 'src/app/core/services/Compras/devolucion-list-state.service';
import { DevolucionListView } from 'src/app/core/interfaces/Compras/DevolucionListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { LoginService } from 'src/app/core/services/core/login.service';

@Component({
  selector: 'app-devolucion-compras',
  imports: [modules_depencias, RouterModule, FlexLayoutModule, ReactiveFormsModule],
  templateUrl: './devolucion-compras.component.html',
  styleUrl: './devolucion-compras.component.scss'
})
export class DevolucionComprasComponent {

  //Paginador
  lista_devoluciones: DevolucionListView[] = [];
  dataSource!: MatTableDataSource<DevolucionListView>;
  displayedColumns: string[] = ['fecha', 'proveedor', 'compraorigen', 'numdevolucion', 'importe', 'status', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por numero de devolucion o proveedor en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: DevolucionComprasService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: DevolucionListStateService,
    private loginService: LoginService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarDevolucionesPaginadas();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarDevolucionesPaginadas();
    });
  }

  cargarDevolucionesPaginadas() {
    const texto = this.buscadorControl.value?.trim() || undefined;
    const idEmp = this.loginService.getIdEmpresaActual() ?? 0;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, idEmp, texto).subscribe(data => {
      this.lista_devoluciones = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<DevolucionListView>(this.lista_devoluciones);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarDevolucionesPaginadas();
  }

  editarDevolucion(id: number): void {
    this.router.navigate(['/devolucioncompras/edit', id]);
  }

  visualizarDevolucion(id: number): void {
    this.router.navigate(['/devolucioncompras/view', id]);
  }

  eliminarDevolucion(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar devolución',
        mensaje: '¿Seguro que deseas eliminar esta devolución? Esta acción revierte el stock y costo afectados, y no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(() => {
        this.notificacion.showSuccess('Devolución eliminada con exito!');
        this.cargarDevolucionesPaginadas();
      });
    });
  }

  etiquetaStatus(status: string): string {
    switch (status) {
      case 'R': return 'Registrada';
      default: return status || 'N/A';
    }
  }

  claseStatus(status: string): string {
    switch (status) {
      case 'R': return 'finalizado';
      default: return 'inactive';
    }
  }
}
