import { Component } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { KpitesoreriaComponent } from './vistamovimientos/kpitesoreria/kpitesoreria.component';
import { FiltrosmovimientosComponent } from './vistamovimientos/filtrosmovimientos/filtrosmovimientos.component';
import { VistaMovimientosComponent } from './vistamovimientos/vista-movimientos/vista-movimientos.component';
import { MonitortesoreriaService } from 'src/app/core/services/Tesoreria/monitortesoreria.service';
import { FiltrosTesoreria } from 'src/app/core/interfaces/Tesoreria/FiltrosTesoreria';
import { MovimientoTesoreria } from 'src/app/core/interfaces/Tesoreria/MovimientoTesoreria';

@Component({
  selector: 'app-monitortesoreria',
  imports: [modules_depencias, RouterModule, FormsModule, KpitesoreriaComponent, FiltrosmovimientosComponent, VistaMovimientosComponent],
  templateUrl: './monitortesoreria.component.html',
  styleUrl: './monitortesoreria.component.scss'
})
export class MonitortesoreriaComponent {

  // Un solo "Tipo de Informe" por ahora (Movimientos y Saldo) - el selector
  // queda listo para sumar reportes despues, mismo patron que monitorcompras.
  reporteSeleccionado = 'movimientos';

  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;

  obj_filtros!: FiltrosTesoreria;
  filtrosActuales: any;

  lista_movimientos: MovimientoTesoreria[] = [];
  kpisData: any[] = [];

  constructor(private service: MonitortesoreriaService) { }

  ngOnInit(): void {
    this.cargarFiltros();
  }

  cargarFiltros() {
    this.service.filtrosgenerales().subscribe({
      next: (data) => {
        this.obj_filtros = data;
      },
      error: (err) => {
        console.error('Error cargando filtros de tesoreria', err);
      }
    });
  }

  // Nueva consulta (el usuario cambio filtros y le dio "Consultar"): vuelve a la primera pagina.
  consultarMovimientos(filtrosRecibidos: any) {
    this.paginaActual = 0;
    this.buscarMovimientos(filtrosRecibidos);
  }

  private buscarMovimientos(filtrosRecibidos: any) {
    this.filtrosActuales = filtrosRecibidos;
    this.lista_movimientos = [];

    this.service.movimientos(this.paginaActual, this.pageSize, filtrosRecibidos).subscribe(res => {
      this.kpisData = res.kpis;
      this.lista_movimientos = res.detalles;
      this.totalRegistros = res.totalElements;
    });
  }

  paginacionMovimientos(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.buscarMovimientos(this.filtrosActuales);
  }
}
