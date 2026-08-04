import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { Categoria } from '../../../core/models/Bodega/Categoria';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { CategoriaService } from '../../../core/services/Bodega/categoria.service';
import { CategoriaListStateService } from '../../../core/services/Bodega/categoria-list-state.service';
import { CategoriaListView } from '../../../core/models/Bodega/CategoriaListView';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ConfirmDialogComponent } from 'src/app/modules/resources/confirm-dialog/confirm-dialog.component';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';

// Codigo del formulario en md_menu (matriz de permisos)
const MENU_CODIGO = 'INV_CAT';

@Component({
  selector: 'categorias',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss'
})
export class CategoriasComponent {


  //Paginador
  lista_Categorias: CategoriaListView[] = [];
  dataSource!: MatTableDataSource<CategoriaListView>;
  Columnas: string[] = ['codigo', 'nombre', 'estado', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Buscador (filtra por codigo o nombre en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Segun los permisos del rol actual sobre este formulario
  puedeCrear = false;
  puedeEditar = false;
  puedeEliminar = false;

  constructor(
    private service: CategoriaService,
    private notificacion: NotificacionesService,
    private router: Router,
    private listState: CategoriaListStateService,
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

    this.cargarCategoriasPaginadas();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarCategoriasPaginadas();
    });
  }

  // 1. Método para cargar datos con paginación
  cargarCategoriasPaginadas() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    // Llama al servicio con los parámetros actuales
    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {

      // Mapea la respuesta Page
      this.lista_Categorias = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<CategoriaListView>(this.lista_Categorias);
    });
  }

  // 2. Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarCategoriasPaginadas(); // Llama al API con los nuevos parámetros
  }

  //Edicion del registro
  editarCategoria(id: number): void {
    // Navega a '/categoria/edit/5' si el ID es 5
    console.log("Entro a editar");
    console.log(id);
    this.router.navigate(['/categoria/edit', id]);
  }

  visualizarCategoria(id: number): void {
    this.router.navigate(['/categoria/view', id]);
  }

  //Eliminar registro (previa confirmación del usuario)
  eliminarCaegoria(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar categoría',
        mensaje: '¿Seguro que deseas eliminar esta categoría? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) {
        return;
      }
      this.service.delete(id).subscribe(data => {
        this.lista_Categorias = this.lista_Categorias.filter(categoria => categoria.id !== id);
        this.dataSource = new MatTableDataSource<CategoriaListView>(this.lista_Categorias);
        this.notificacion.showSuccess('Categoria Eliminada con exito!');
      });
    });
  }

}
