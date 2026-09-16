import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DevolucionVentasService } from 'src/app/core/services/Ventas/devolucion-ventas.service';
import { DevolucionVentasListStateService } from 'src/app/core/services/Ventas/devolucion-ventas-list-state.service';
import { NotaFacturaListView } from 'src/app/core/interfaces/Comercial/NotaFacturaListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';

// Codigo del formulario en md_menu (matriz de permisos)
const MENU_CODIGO = 'VEN_NOTACR';

@Component({
  selector: 'app-devolucion-ventas',
  imports: [modules_depencias, RouterModule, FlexLayoutModule, ReactiveFormsModule],
  templateUrl: './devolucion-ventas.component.html',
  styleUrl: './devolucion-ventas.component.scss'
})
export class DevolucionVentasComponent {

  lista_notas: NotaFacturaListView[] = [];
  dataSource!: MatTableDataSource<NotaFacturaListView>;
  displayedColumns: string[] = ['fecha', 'cliente', 'facturaorigen', 'numnota', 'importe', 'status', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  buscadorControl = new FormControl('');

  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  puedeCrear = false;
  puedeEditar = false;
  puedeEliminar = false;

  constructor(
    private service: DevolucionVentasService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: DevolucionVentasListStateService,
    private permisosState: PermisosStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.permisosState.cargar().subscribe(() => {
      this.puedeCrear = this.permisosState.tienePermiso(MENU_CODIGO, 'CREAR');
      this.puedeEditar = this.permisosState.tienePermiso(MENU_CODIGO, 'EDITAR');
      this.puedeEliminar = this.permisosState.tienePermiso(MENU_CODIGO, 'ELIMINAR');
    });

    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarNotasPaginadas();

    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarNotasPaginadas();
    });
  }

  cargarNotasPaginadas() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_notas = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<NotaFacturaListView>(this.lista_notas);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarNotasPaginadas();
  }

  editarNota(id: number): void {
    this.router.navigate(['/devolucionventas/edit', id]);
  }

  visualizarNota(id: number): void {
    this.router.navigate(['/devolucionventas/view', id]);
  }

  eliminarNota(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar nota crédito',
        mensaje: '¿Seguro que deseas eliminar esta nota crédito? Esta acción revierte el stock afectado, y no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(() => {
        this.notificacion.showSuccess('Nota crédito eliminada con exito!');
        this.cargarNotasPaginadas();
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
