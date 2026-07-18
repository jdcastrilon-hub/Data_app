import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CierreTurnoService } from 'src/app/core/services/Ventas/cierreturno.service';
import { CierreListStateService } from 'src/app/core/services/Ventas/cierre-list-state.service';
import { CierreListView } from 'src/app/core/interfaces/Comercial/CierreListView';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-cierreturno',
  imports: [modules_depencias, RouterModule, FlexLayoutModule, ReactiveFormsModule],
  templateUrl: './cierreturno.component.html',
  styleUrl: './cierreturno.component.scss'
})
export class CierreturnoComponent {

  //Paginador
  lista_cierres: CierreListView[] = [];
  dataSource!: MatTableDataSource<CierreListView>;
  todasLasColumnas: string[] = ['id', 'fecha', 'usuario', 'caja', 'total', 'descuadre', 'actions'];
  displayedColumns: string[] = [];

  //Buscador (filtra por nro. de cierre o usuario en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: CierreTurnoService,
    private router: Router,
    private listState: CierreListStateService
  ) { }

  ngOnInit() {
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarCierresPaginados();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');

    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarCierresPaginados();
    });
  }

  cargarCierresPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_cierres = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<CierreListView>(this.lista_cierres);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarCierresPaginados();
  }

  visualizarCierre(id: number): void {
    this.router.navigate(['/cierreturno/view', id]);
  }
}
