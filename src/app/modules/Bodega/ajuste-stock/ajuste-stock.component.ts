import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AjusteStockService } from '../../../core/services/Bodega/ajuste-stock.service';
import { AjusteStockListStateService } from '../../../core/services/Bodega/ajuste-stock-list-state.service';
import { AjusteStockListView } from '../../../core/models/Bodega/AjusteStockListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'ajuste-stock',
  imports: [modules_depencias, RouterModule, MatTooltipModule, ReactiveFormsModule],
  templateUrl: './ajuste-stock.component.html',
  styleUrl: './ajuste-stock.component.scss'
})
export class AjusteStockComponent {

  lista_ajustes: AjusteStockListView[] = [];
  dataSource!: MatTableDataSource<AjusteStockListView>;
  Columnas: string[] = ['id', 'nrodocum', 'fecha', 'bodega', 'estado', 'motivo','obs','actions'];
  displayedColumns: string[] = [];

  //Buscador (filtra por numero de documento u observacion en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: AjusteStockService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: AjusteStockListStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.CargarLista();
    this.ValidarColumnas();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.CargarLista();
    });
  }

  CargarLista() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_ajustes = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<AjusteStockListView>(this.lista_ajustes);
    });
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.CargarLista(); // Llama al API con los nuevos parámetros
  }

  visualizarAjusteStock(id: number): void {
    this.router.navigate(['/ajustestock/view', id]);
  }

  editarAjusteStock(id: number): void {
    this.router.navigate(['/ajustestock/edit', id]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarAjusteStock(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar ajuste de stock',
        mensaje: '¿Seguro que deseas eliminar este ajuste? Se revertirá su impacto en el stock y no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(data => {
        this.lista_ajustes = this.lista_ajustes.filter(ajuste => ajuste.idTrans !== id);
        this.dataSource = new MatTableDataSource<AjusteStockListView>(this.lista_ajustes);
        this.notificacion.showSuccess('Ajuste eliminado con exito!');
      });
    });
  }

  ValidarColumnas() {
    //this.displayedColumns = this.todasLasColumnas;
    this.displayedColumns = this.Columnas.filter(columna => columna !== 'id');
  }
}
