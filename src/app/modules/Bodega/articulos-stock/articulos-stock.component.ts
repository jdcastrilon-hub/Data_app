import { Component, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ArticuloListView } from 'src/app/core/interfaces/Bodega/ArticuloListView';
import { ArticuloService } from 'src/app/core/services/Bodega/articulo.service';
import { ArticuloListStateService } from 'src/app/core/services/Bodega/articulo-list-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { ModalLotesComponent } from './modal-lotes/modal-lotes.component';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';

// Codigo del formulario en md_menu (matriz de permisos)
const MENU_CODIGO = 'INV_ART';

@Component({
  selector: 'app-articulos-stock',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './articulos-stock.component.html',
  styleUrl: './articulos-stock.component.scss'
})
export class ArticulosStockComponent {

  //Paginador
  list_articulos: ArticuloListView[] = [];
  dataSource!: MatTableDataSource<ArticuloListView>;
  Columnas: string[] = ['codigo', 'nombre', 'negocio', 'categoria', 'subcategoria', 'activo', 'actions'];

  //Buscador (filtra por codigo o nombre en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Segun los permisos del rol actual sobre este formulario
  puedeCrear = false;
  puedeEditar = false;
  puedeEliminar = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: ArticuloService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: ArticuloListStateService,
    private permisosState: PermisosStateService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.permisosState.cargar().subscribe(() => {
      this.puedeCrear = this.permisosState.tienePermiso(MENU_CODIGO, 'CREAR');
      this.puedeEditar = this.permisosState.tienePermiso(MENU_CODIGO, 'EDITAR');
      this.puedeEliminar = this.permisosState.tienePermiso(MENU_CODIGO, 'ELIMINAR');
    });

    // Restaura el filtro/pagina donde haya quedado la ultima vez (sin importar si se
    // llega aqui desde "volver" en ver/editar/nuevo, o desde el menu directamente).
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarArticulosPaginadas();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarArticulosPaginadas();
    });
  }

  // 1. Método para cargar datos con paginación
  cargarArticulosPaginadas() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    // Llama al servicio con los parámetros actuales
    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      // Mapea la respuesta Page
      this.list_articulos = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<ArticuloListView>(this.list_articulos);
    });
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarArticulosPaginadas(); // Llama al API con los nuevos parámetros
  }


  //Edicion del registro
  editarArticulo(id: number): void {
    // Navega a '/categoria/edit/5' si el ID es 5
    console.log("Entro a editar");
    console.log(id);
    this.router.navigate(['/articulos/edit', id]);

  }

  visualizarArticulo(id: number): void {
    this.router.navigate(['/articulos/view', id]);
  }

  abrirLotes(articulo: ArticuloListView): void {
    this.dialog.open(ModalLotesComponent, {
      width: '60%',
      data: {
        idArticulo: articulo.id_articulo,
        codArticulo: articulo.codArticulo,
        nomArticulo: articulo.nomArticulo
      }
    });
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarArticulo(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar artículo',
        mensaje: '¿Seguro que deseas eliminar este artículo? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(data => {
        this.list_articulos = this.list_articulos.filter(articulo => articulo.id_articulo !== id);
        this.dataSource = new MatTableDataSource<ArticuloListView>(this.list_articulos);
        this.notificacion.showSuccess('Articulo Eliminada con exito!');
      });
    });
  }

}
