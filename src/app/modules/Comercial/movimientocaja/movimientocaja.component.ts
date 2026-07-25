import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MovimientoCajaService } from 'src/app/core/services/Ventas/movimientocaja.service';
import { MovCajaListStateService } from 'src/app/core/services/Ventas/movcaja-list-state.service';
import { MovCajaListView } from 'src/app/core/interfaces/Comercial/MovCajaListView';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-movimientocaja',
  imports: [modules_depencias, RouterModule, FlexLayoutModule, ReactiveFormsModule],
  templateUrl: './movimientocaja.component.html',
  styleUrl: './movimientocaja.component.scss'
})
export class MovimientocajaComponent {

  //Paginador
  lista_movimientos: MovCajaListView[] = [];
  dataSource!: MatTableDataSource<MovCajaListView>;
  todasLasColumnas: string[] = ['id', 'fecha', 'concepto', 'tipo', 'importe', 'actions'];
  displayedColumns: string[] = [];

  //Buscador (filtra por nombre de concepto en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: MovimientoCajaService,
    private router: Router,
    private listState: MovCajaListStateService
  ) { }

  ngOnInit() {
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarMovimientosPaginados();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');

    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarMovimientosPaginados();
    });
  }

  cargarMovimientosPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_movimientos = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<MovCajaListView>(this.lista_movimientos);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarMovimientosPaginados();
  }

  visualizarMovimiento(id: number): void {
    this.router.navigate(['/movimientocaja/view', id]);
  }

  etiquetaSigno(signo: number): string {
    return signo === 1 ? 'Ingreso' : 'Gasto';
  }
}
