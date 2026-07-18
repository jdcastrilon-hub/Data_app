import { Component } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { VentaServiceService } from 'src/app/core/services/Ventas/venta-service.service';
import { VentaListStateService } from 'src/app/core/services/Ventas/venta-list-state.service';
import { VentaListView } from 'src/app/core/interfaces/Comercial/VentaListView';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-venta-directa',
  imports: [modules_depencias, RouterModule, FlexLayoutModule, ReactiveFormsModule],
  templateUrl: './venta-directa.component.html',
  styleUrl: './venta-directa.component.scss'
})
export class VentaDirectaComponent {

  //Paginador
  lista_ventas: VentaListView[] = [];
  dataSource!: MatTableDataSource<VentaListView>;
  todasLasColumnas: string[] = ['id', 'fecha', 'cliente', 'numdocum', 'documento', 'bodega', 'importe', 'actions'];
  displayedColumns: string[] = [];

  //Buscador (filtra por nro. de documento o cliente en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: VentaServiceService,
    private router: Router,
    private listState: VentaListStateService
  ) { }

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarVentasPaginadas();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0; // toda busqueda nueva vuelve a la primera pagina
      this.cargarVentasPaginadas();
    });
  }

  cargarVentasPaginadas() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    // Recuerda el estado actual para cuando se vuelva a esta lista mas adelante.
    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto, 'VentaDirect').subscribe(data => {
      this.lista_ventas = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<VentaListView>(this.lista_ventas);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarVentasPaginadas();
  }

  editarVenta(id: number): void {
    this.router.navigate(['/ventas/edit', id]);
  }

  visualizarVenta(id: number): void {
    this.router.navigate(['/ventas/view', id]);
  }
}
