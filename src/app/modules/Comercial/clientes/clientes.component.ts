import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { ClienteView } from 'src/app/core/interfaces/Comercial/ClienteView';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ClientesService } from 'src/app/core/services/Ventas/clientes.service';
import { ClienteListStateService } from 'src/app/core/services/Ventas/cliente-list-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';

// Codigo del formulario en md_menu (matriz de permisos)
const MENU_CODIGO = 'VEN_CLI';

@Component({
  selector: 'app-clientes',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent {

  //Paginador
  lista_clientes: ClienteView[] = [];
  dataSource!: MatTableDataSource<ClienteView>;
  todasLasColumnas: string[] = ['id', 'codtit', 'nombre', 'activo', 'fecha', 'actions'];
  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por documento o nombre en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Segun los permisos del rol actual sobre este formulario (VEN_CLI) - se
  // esconden los botones que igual rebotarian con 403 en el backend.
  puedeCrear = false;
  puedeEditar = false;
  puedeEliminar = false;

  constructor(
    private service: ClientesService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: ClienteListStateService,
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

    this.cargarClientesPaginados();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarClientesPaginados();
    });
  }

  cargarClientesPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_clientes = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<ClienteView>(this.lista_clientes);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarClientesPaginados();
  }

  editarCliente(id: number): void {
    this.router.navigate(['/clientes/edit', id]);
  }

  visualizarCliente(id: number): void {
    this.router.navigate(['/clientes/view', id]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarCliente(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar cliente',
        mensaje: '¿Seguro que deseas eliminar este cliente? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(() => {
        this.notificacion.showSuccess('Cliente eliminado con exito!');
        this.cargarClientesPaginados();
      });
    });
  }
}
