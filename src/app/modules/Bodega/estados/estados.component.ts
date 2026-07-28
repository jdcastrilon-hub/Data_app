import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { EstadosService } from '../../../core/services/Bodega/estados.service';
import { EstadoListStateService } from '../../../core/services/Bodega/estado-list-state.service';
import { EstadoListView } from '../../../core/interfaces/Bodega/EstadoListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';

// Codigo del formulario en md_menu (matriz de permisos)
const MENU_CODIGO = 'INV_EST';

@Component({
  selector: 'estados',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './estados.component.html',
  styleUrl: './estados.component.scss'
})
export class EstadosComponent {

  //Paginador
  lista_estados: EstadoListView[] = [];
  dataSource!: MatTableDataSource<EstadoListView>;
  Columnas: string[] = ['codigo', 'nombre', 'activo', 'fecha', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por codigo o nombre en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Segun los permisos del rol actual sobre este formulario (INV_EST) - se
  // esconden los botones que igual rebotarian con 403 en el backend.
  puedeCrear = false;
  puedeEditar = false;
  puedeEliminar = false;

  constructor(
    private service: EstadosService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: EstadoListStateService,
    private permisosState: PermisosStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.permisosState.cargar().subscribe(() => {
      this.puedeCrear = this.permisosState.tienePermiso(MENU_CODIGO, 'CREAR');
      this.puedeEditar = this.permisosState.tienePermiso(MENU_CODIGO, 'EDITAR');
      this.puedeEliminar = this.permisosState.tienePermiso(MENU_CODIGO, 'ELIMINAR');
    });

    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarEstadosPaginados();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarEstadosPaginados();
    });
  }

  // 1. Método para cargar datos con paginación
  cargarEstadosPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_estados = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<EstadoListView>(this.lista_estados);
    });
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarEstadosPaginados();
  }

  //Edicion del registro
  editarEstado(id: number): void {
    this.router.navigate(['/estados/edit', id]);
  }

  visualizarEstado(id: number): void {
    this.router.navigate(['/estados/view', id]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarEstado(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar estado',
        mensaje: '¿Seguro que deseas eliminar este estado? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(data => {
        this.lista_estados = this.lista_estados.filter(estado => estado.id !== id);
        this.dataSource = new MatTableDataSource<EstadoListView>(this.lista_estados);
        this.notificacion.showSuccess('Estado eliminado con exito!');
      });
    });
  }

}
