import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { Compra } from 'src/app/core/models/Compras/Compra';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ComprasService } from 'src/app/core/services/Compras/compras.service';
import { CompraListStateService } from 'src/app/core/services/Compras/compra-list-state.service';
import { CompraListView } from 'src/app/core/interfaces/Compras/CompraListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-compra-directa',
  imports: [modules_depencias, RouterModule, FlexLayoutModule, ReactiveFormsModule],
  templateUrl: './compra-directa.component.html',
  styleUrl: './compra-directa.component.scss'
})
export class CompraDirectaComponent {

  //Paginador
  lista_bodegas: CompraListView[] = [];
  dataSource!: MatTableDataSource<CompraListView>;
  todasLasColumnas: string[] = ['id', 'fecha', 'proveedor', 'numoc', 'remito', 'bodega', 'importe', 'status', 'actions'];
  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por documento, remito o proveedor en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: ComprasService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: CompraListStateService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarComprasPaginadas();
    this.ValidarColumnas();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarComprasPaginadas();
    });
  }

  // 1. Método para cargar datos con paginación
  cargarComprasPaginadas() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    // Llama al servicio con los parámetros actuales
    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {

      // Mapea la respuesta Page
      this.lista_bodegas = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<CompraListView>(this.lista_bodegas);
    });
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarComprasPaginadas(); // Llama al API con los nuevos parámetros
  }

  //Edicion del registro
  editarCompra(id: number): void {
    this.router.navigate(['/compras/edit', id]);
  }

  visualizarCompra(id: number): void {
    this.router.navigate(['/compras/view', id]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarCompra(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar compra',
        mensaje: '¿Seguro que deseas eliminar esta compra? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(() => {
        this.notificacion.showSuccess('Compra eliminada con exito!');
        this.cargarComprasPaginadas();
      });
    });
  }

  ValidarColumnas() {
    //this.displayedColumns = this.todasLasColumnas;
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');
  }

  // Traduce el codigo de status ('B'/'F'/'C') a la etiqueta y clase CSS del badge
  etiquetaStatus(status: string): string {
    switch (status) {
      case 'B': return 'Borrador';
      case 'F': return 'Finalizado';
      case 'C': return 'Cancelado';
      default: return 'N/A';
    }
  }

  claseStatus(status: string): string {
    switch (status) {
      case 'B': return 'borrador';
      case 'F': return 'finalizado';
      case 'C': return 'cancelado';
      default: return 'inactive';
    }
  }


}
