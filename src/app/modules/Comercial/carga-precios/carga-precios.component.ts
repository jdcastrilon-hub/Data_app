import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CargapreciosService } from '../../../core/services/Ventas/cargaprecios.service';
import { CargapreciosListStateService } from '../../../core/services/Ventas/cargaprecios-list-state.service';
import { CargaPreciosListView } from '../../../core/interfaces/Comercial/CargaPreciosListView';

@Component({
  selector: 'carga-precios',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule, MatTooltipModule],
  templateUrl: './carga-precios.component.html',
  styleUrl: './carga-precios.component.scss'
})
export class CargaPreciosComponent {

  //Paginador
  lista_cargas: CargaPreciosListView[] = [];
  dataSource!: MatTableDataSource<CargaPreciosListView>;
  Columnas: string[] = ['nrodocum', 'fecha', 'lista', 'archivo', 'obs', 'actions'];

  //Buscador (filtra por observacion o nombre de archivo en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: CargapreciosService,
    private router: Router,
    private listState: CargapreciosListStateService
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
      this.dataSource = new MatTableDataSource<CargaPreciosListView>(this.lista_cargas);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarLista();
  }

  visualizarCarga(id: number): void {
    this.router.navigate(['/cargaprecios/view', id]);
  }

  // No hay eliminarCarga a proposito: esta carga impacta p_precios y puede haber
  // cascadeado reglas de categoria (ver nota en repository_cargaprecios.py).

}
