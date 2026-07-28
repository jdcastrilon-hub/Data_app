import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CargastockService } from '../../../core/services/Bodega/cargastock.service';
import { CargastockListStateService } from '../../../core/services/Bodega/cargastock-list-state.service';
import { CargaStockListView } from '../../../core/interfaces/Bodega/CargaStockListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'cargastock',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule, MatTooltipModule],
  templateUrl: './cargastock.component.html',
  styleUrl: './cargastock.component.scss'
})
export class CargastockComponent {

  //Paginador
  lista_cargas: CargaStockListView[] = [];
  dataSource!: MatTableDataSource<CargaStockListView>;
  Columnas: string[] = ['nrodocum', 'fecha', 'bodega', 'estado', 'archivo', 'obs', 'actions'];

  //Buscador (filtra por observacion o nombre de archivo en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: CargastockService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: CargastockListStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarLista();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarLista();
    });
  }

  cargarLista() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_cargas = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<CargaStockListView>(this.lista_cargas);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarLista();
  }

  visualizarCarga(id: number): void {
    this.router.navigate(['/cargastock/view', id]);
  }

  //Eliminar registro (previa confirmación del usuario) - no tiene edicion, solo ver/eliminar
  eliminarCarga(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar carga masiva',
        mensaje: '¿Seguro que deseas eliminar esta carga? Se revertirá su impacto en el stock y los costos, y no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(() => {
        this.lista_cargas = this.lista_cargas.filter(c => c.idTrans !== id);
        this.dataSource = new MatTableDataSource<CargaStockListView>(this.lista_cargas);
        this.notificacion.showSuccess('Carga eliminada con exito!');
      });
    });
  }

}
