import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { ProveedorView } from 'src/app/core/interfaces/Compras/ProveedorView';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ProveedorService } from 'src/app/core/services/Compras/proveedor.service';
import { ProveedorListStateService } from 'src/app/core/services/Compras/proveedor-list-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';

// Codigo del formulario en md_menu (matriz de permisos)
const MENU_CODIGO = 'COM_PRO';

@Component({
  selector: 'proveedores',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.scss'
})
export class ProveedoresComponent {

  //Paginador
  lista_proveedor: ProveedorView[] = [];
  dataSource!: MatTableDataSource<ProveedorView>;
  todasLasColumnas: string[] = ['id', 'codtit', 'nombre', 'activo', 'fecha', 'actions'];
  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por documento o razon social en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Segun los permisos del rol actual sobre este formulario (COM_PRO) - se
  // esconden los botones que igual rebotarian con 403 en el backend.
  puedeCrear = false;
  puedeEditar = false;
  puedeEliminar = false;

  constructor(
    private service: ProveedorService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: ProveedorListStateService,
    private permisosState: PermisosStateService,
    private dialog: MatDialog
  ) {}

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

    this.cargarProveedoresPaginados();
    this.ValidarColumnas();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarProveedoresPaginados();
    });
  }

  // 1. Método para cargar datos con paginación
  cargarProveedoresPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_proveedor = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB
      this.dataSource = new MatTableDataSource<ProveedorView>(this.lista_proveedor);
    });
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarProveedoresPaginados(); // Llama al API con los nuevos parámetros
  }

  //Edicion del registro
  editarProveedor(id: number): void {
    this.router.navigate(['/proveedores/edit', id]);
  }

  visualizarProveedor(id: number): void {
    this.router.navigate(['/proveedores/view', id]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarProveedor(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar proveedor',
        mensaje: '¿Seguro que deseas eliminar este proveedor? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(() => {
        this.notificacion.showSuccess('Proveedor eliminado con exito!');
        this.cargarProveedoresPaginados();
      });
    });
  }

  ValidarColumnas() {
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');
  }

}
