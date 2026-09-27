import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PrestamoService } from 'src/app/core/services/Prestamos/prestamo.service';
import { PrestamoListStateService } from 'src/app/core/services/Prestamos/prestamo-list-state.service';
import { PrestamoListView } from 'src/app/core/interfaces/Prestamos/PrestamoListView';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';

// Codigo del formulario en md_menu (matriz de permisos)
const MENU_CODIGO = 'PRE_CONTRATOS';

@Component({
  selector: 'app-prestamos',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './prestamos.component.html',
  styleUrl: './prestamos.component.scss'
})
export class PrestamosComponent {

  lista_prestamos: PrestamoListView[] = [];
  dataSource!: MatTableDataSource<PrestamoListView>;
  Columnas: string[] = ['nroDocum', 'cliente', 'fecDesembolso', 'capital', 'valorCuota', 'estado', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  buscadorControl = new FormControl('');

  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Fase 1: solo originar y ver - no hay edicion ni eliminacion de un
  // contrato ya desembolsado todavia (retanqueo/ajuste de cuotas, fase 2).
  puedeCrear = false;

  constructor(
    private service: PrestamoService,
    private router: Router,
    private listState: PrestamoListStateService,
    private permisosState: PermisosStateService
  ) { }

  ngOnInit() {
    this.permisosState.cargar().subscribe(() => {
      this.puedeCrear = this.permisosState.tienePermiso(MENU_CODIGO, 'CREAR');
    });

    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarPrestamosPaginados();

    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarPrestamosPaginados();
    });
  }

  cargarPrestamosPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    this.service.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_prestamos = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<PrestamoListView>(this.lista_prestamos);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarPrestamosPaginados();
  }

  visualizarPrestamo(id: number): void {
    this.router.navigate(['/prestamos/view', id]);
  }
}
