import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { CategoriaXUtilidadView } from '../../../core/models/Compras/CategoriaXUtilidadView';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CategoriaxutilidadService } from '../../../core/services/Compras/categoriaxutilidad.service';
import { CategoriaxutilidadListStateService } from '../../../core/services/Compras/categoriaxutilidad-list-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';

// Codigo del formulario en md_menu (matriz de permisos)
const MENU_CODIGO = 'COM_UTILCAT';

@Component({
  selector: 'categoriasxutilidad',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './categoriasxutilidad.component.html',
  styleUrl: './categoriasxutilidad.component.scss'
})
export class CategoriasxutilidadComponent {

  //Paginador
  lista_utilidad: CategoriaXUtilidadView[] = [];
  dataSource!: MatTableDataSource<CategoriaXUtilidadView>;
  Columnas: string[] = ['categoria', 'subcategoria', 'porcUtilidad', 'estado', 'fecha', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por nombre de categoria o subcategoria en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Segun los permisos del rol actual sobre este formulario (COM_UTILCAT) - se
  // esconden los botones que igual rebotarian con 403 en el backend.
  puedeCrear = false;
  puedeEditar = false;
  puedeEliminar = false;

  constructor(
    private service: CategoriaxutilidadService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: CategoriaxutilidadListStateService,
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

    this.cargarPaginado();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarPaginado();
    });
  }

  cargarPaginado() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_utilidad = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<CategoriaXUtilidadView>(this.lista_utilidad);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarPaginado();
  }

  editar(id: number): void {
    this.router.navigate(['/utilidadxcategoria/edit', id]);
  }

  visualizar(id: number): void {
    this.router.navigate(['/utilidadxcategoria/view', id]);
  }

  eliminar(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar configuración de utilidad',
        mensaje: '¿Seguro que deseas eliminar esta configuración? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(() => {
        this.notificacion.showSuccess('Configuración eliminada con éxito!');
        this.cargarPaginado();
      });
    });
  }

}
