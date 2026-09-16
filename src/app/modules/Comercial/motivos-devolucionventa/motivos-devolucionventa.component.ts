import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MotivoDevolucionVentaView } from '../../../core/models/Comercial/MotivoDevolucionVentaView';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MotivosDevolucionVentaService } from '../../../core/services/Ventas/motivos-devolucionventa.service';
import { MotivoDevolucionVentaListStateService } from '../../../core/services/Ventas/motivo-devolucionventa-list-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';

// Codigo del formulario en md_menu (matriz de permisos)
const MENU_CODIGO = 'VEN_MOTIVO';

@Component({
  selector: 'motivos-devolucionventa',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './motivos-devolucionventa.component.html',
  styleUrl: './motivos-devolucionventa.component.scss'
})
export class MotivosDevolucionVentaComponent {

  lista_motivos: MotivoDevolucionVentaView[] = [];
  dataSource!: MatTableDataSource<MotivoDevolucionVentaView>;
  Columnas: string[] = ['id', 'name', 'devuelveDinero', 'afectaStock', 'estado', 'fecha', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  buscadorControl = new FormControl('');

  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  puedeCrear = false;
  puedeEditar = false;
  puedeEliminar = false;

  constructor(
    private service: MotivosDevolucionVentaService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: MotivoDevolucionVentaListStateService,
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

    this.cargarMotivosPaginados();

    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarMotivosPaginados();
    });
  }

  cargarMotivosPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_motivos = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<MotivoDevolucionVentaView>(this.lista_motivos);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarMotivosPaginados();
  }

  editarMotivo(id: number): void {
    this.router.navigate(['/motivosdevolucionventa/edit', id]);
  }

  visualizarMotivo(id: number): void {
    this.router.navigate(['/motivosdevolucionventa/view', id]);
  }

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
