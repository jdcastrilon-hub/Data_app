import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AbrirturnoService } from 'src/app/core/services/Ventas/abrirturno.service';
import { TurnoListStateService } from 'src/app/core/services/Ventas/turno-list-state.service';
import { TurnoListView } from 'src/app/core/interfaces/Comercial/TurnoListView';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-turnos',
  imports: [modules_depencias, RouterModule, FlexLayoutModule, ReactiveFormsModule],
  templateUrl: './turnos.component.html',
  styleUrl: './turnos.component.scss'
})
export class TurnosComponent {

  //Paginador
  lista_turnos: TurnoListView[] = [];
  dataSource!: MatTableDataSource<TurnoListView>;
  todasLasColumnas: string[] = ['id', 'fecha', 'caja', 'usuario', 'impbase', 'status', 'actions'];
  displayedColumns: string[] = [];

  //Buscador (filtra por id o usuario en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: AbrirturnoService,
    private router: Router,
    private listState: TurnoListStateService
  ) { }

  ngOnInit() {
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarTurnosPaginados();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');

    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarTurnosPaginados();
    });
  }

  cargarTurnosPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_turnos = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<TurnoListView>(this.lista_turnos);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarTurnosPaginados();
  }

  editarTurno(id: number): void {
    this.router.navigate(['/turno/edit', id]);
  }

  visualizarTurno(id: number): void {
    this.router.navigate(['/turno/view', id]);
  }

  etiquetaStatus(status: boolean): string {
    return status ? 'Abierto' : 'Cerrado';
  }
}
