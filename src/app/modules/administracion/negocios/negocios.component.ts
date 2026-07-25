import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { NegocioView } from 'src/app/core/interfaces/Core/NegocioView';
import { NegocioServiceService } from 'src/app/core/services/General/negocio-service.service';
import { NegocioListStateService } from 'src/app/core/services/core/negocio-list-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-negocios',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './negocios.component.html',
  styleUrl: './negocios.component.scss'
})
export class NegociosComponent {

  //Paginador
  lista_negocios: NegocioView[] = [];
  dataSource!: MatTableDataSource<NegocioView>;
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
    private service: NegocioServiceService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: NegocioListStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarNegociosPaginados();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');

    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarNegociosPaginados();
    });
  }

  cargarNegociosPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_negocios = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<NegocioView>(this.lista_negocios);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarNegociosPaginados();
  }

  editarNegocio(id: number): void {
    this.router.navigate(['/negocios/edit', id]);
  }

  visualizarNegocio(id: number): void {
    this.router.navigate(['/negocios/view', id]);
  }

  eliminarNegocio(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar negocio',
        mensaje: '¿Seguro que deseas eliminar este negocio? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe({
        next: () => {
          this.notificacion.showSuccess('Negocio eliminado con exito!');
          this.cargarNegociosPaginados();
        },
        error: (err) => {
          this.notificacion.showError(err.error?.message || 'No se pudo eliminar el negocio.');
        }
      });
    });
  }

}
