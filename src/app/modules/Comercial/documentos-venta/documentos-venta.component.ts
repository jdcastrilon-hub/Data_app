import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DocumentosVentaService } from 'src/app/core/services/Ventas/documentos-venta.service';
import { DocumentosVentaListStateService } from 'src/app/core/services/Ventas/documentos-venta-list-state.service';
import { DocumentoVentaListView } from 'src/app/core/interfaces/Comercial/DocumentoVentaListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-documentos-venta',
  imports: [modules_depencias, RouterModule, FlexLayoutModule, ReactiveFormsModule],
  templateUrl: './documentos-venta.component.html',
  styleUrl: './documentos-venta.component.scss'
})
export class DocumentosVentaComponent {

  //Paginador
  lista_documentos: DocumentoVentaListView[] = [];
  dataSource!: MatTableDataSource<DocumentoVentaListView>;
  todasLasColumnas: string[] = ['documento', 'descripcion', 'sucursal', 'serie', 'clase', 'pos', 'activo', 'actions'];
  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por documento o descripcion en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: DocumentosVentaService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: DocumentosVentaListStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarDocumentosPaginados();
    this.displayedColumns = this.todasLasColumnas;

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarDocumentosPaginados();
    });
  }

  cargarDocumentosPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_documentos = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<DocumentoVentaListView>(this.lista_documentos);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarDocumentosPaginados();
  }

  editarDocumento(element: DocumentoVentaListView): void {
    this.router.navigate(['/documentos-venta/edit', element.idSucursal, element.documento]);
  }

  visualizarDocumento(element: DocumentoVentaListView): void {
    this.router.navigate(['/documentos-venta/view', element.idSucursal, element.documento]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarDocumento(element: DocumentoVentaListView): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar documento de venta',
        mensaje: '¿Seguro que deseas eliminar este documento de venta? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(element.idSucursal, element.documento).subscribe(() => {
        this.notificacion.showSuccess('Documento de venta eliminado con exito!');
        this.cargarDocumentosPaginados();
      });
    });
  }
}
