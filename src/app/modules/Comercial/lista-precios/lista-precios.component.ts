import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ListaprecioService } from 'src/app/core/services/Ventas/listaprecio.service';
import { ListaprecioListStateService } from 'src/app/core/services/Ventas/listaprecio-list-state.service';
import { ListaPrecioListView } from 'src/app/core/interfaces/Comercial/ListaPrecioListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-lista-precios',
  imports: [modules_depencias, RouterModule, FlexLayoutModule, ReactiveFormsModule],
  templateUrl: './lista-precios.component.html',
  styleUrl: './lista-precios.component.scss'
})
export class ListaPreciosComponent {

  //Paginador
  lista_listaprecio: ListaPrecioListView[] = [];
  dataSource!: MatTableDataSource<ListaPrecioListView>;
  todasLasColumnas: string[] = ['idLista', 'nombre', 'cliente', 'esGeneral', 'activo', 'actions'];
  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por nombre en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: ListaprecioService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: ListaprecioListStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarListasPaginadas();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'idLista');

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarListasPaginadas();
    });
  }

  cargarListasPaginadas() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_listaprecio = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<ListaPrecioListView>(this.lista_listaprecio);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarListasPaginadas();
  }

  editarListaPrecio(id: number): void {
    this.router.navigate(['/listaprecios/edit', id]);
  }

  visualizarListaPrecio(id: number): void {
    this.router.navigate(['/listaprecios/view', id]);
  }

  eliminarListaPrecio(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar lista de precios',
        mensaje: '¿Seguro que deseas eliminar esta lista de precios? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(() => {
        this.notificacion.showSuccess('Lista de precios eliminada con exito!');
        this.cargarListasPaginadas();
      });
    });
  }
}
