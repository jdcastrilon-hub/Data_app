import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { VentaServiceService } from 'src/app/core/services/Ventas/venta-service.service';
import { VentaListStateService } from 'src/app/core/services/Ventas/venta-list-state.service';
import { VentaListView } from 'src/app/core/interfaces/Comercial/VentaListView';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-venta-pos',
  imports: [modules_depencias, RouterModule, FlexLayoutModule, ReactiveFormsModule],
  templateUrl: './venta-pos.component.html',
  styleUrl: './venta-pos.component.scss'
})
export class VentaPosComponent {

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
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarVentasPaginadas();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');

    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarVentasPaginadas();
    });
  }

  cargarVentasPaginadas() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto, 'VentaPOS').subscribe(data => {
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
    this.router.navigate(['/ventapos/edit', id]);
  }

  visualizarVenta(id: number): void {
    this.router.navigate(['/ventapos/view', id]);
  }
}
