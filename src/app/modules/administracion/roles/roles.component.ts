import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { RolView } from 'src/app/core/interfaces/Core/RolView';
import { RolService } from 'src/app/core/services/core/rol.service';
import { RolListStateService } from 'src/app/core/services/core/rol-list-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-roles',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class RolesComponent {

  //Paginador
  lista_roles: RolView[] = [];
  dataSource!: MatTableDataSource<RolView>;
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
    private service: RolService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: RolListStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarRolesPaginados();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');

    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarRolesPaginados();
    });
  }

  cargarRolesPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_roles = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<RolView>(this.lista_roles);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarRolesPaginados();
  }

  editarRol(id: number): void {
    this.router.navigate(['/roles/edit', id]);
  }

  visualizarRol(id: number): void {
    this.router.navigate(['/roles/view', id]);
  }

  eliminarRol(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar rol',
        mensaje: '¿Seguro que deseas eliminar este rol? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(() => {
        this.notificacion.showSuccess('Rol eliminado con exito!');
        this.cargarRolesPaginados();
      });
    });
  }

}
