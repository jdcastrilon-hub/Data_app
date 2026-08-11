import { Component } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { FormsModule } from '@angular/forms';
import { MonitoroperacionesService } from 'src/app/core/services/Ventas/monitoroperaciones.service';
import { MonitorOperacionesFiltros } from 'src/app/core/interfaces/Comercial/MonitorOperacionesFiltros';
import { MonitorDetalleVentasRealizadas } from 'src/app/core/interfaces/Comercial/MonitorDetalleVentasRealizadas';
import { MonitorVentaReportePreciosDetalle } from 'src/app/core/interfaces/Comercial/MonitorVentaReportePreciosDetalle';
import { FiltrosventasComponent } from './vistaventas/filtrosventas/filtrosventas.component';
import { KpiventasComponent } from './vistaventas/kpiventas/kpiventas.component';
import { VistaventasrealizadasComponent } from './vistaventas/vistaventasrealizadas/vistaventasrealizadas.component';
import { FiltrosPreciosComponent } from './vistaprecios/filtros/filtros-precios.component';
import { ReporteprecioComponent } from './vistaprecios/reporteprecios/reporteprecios.component';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-monitoroperaciones',
  imports: [modules_depencias, FormsModule, FiltrosventasComponent, KpiventasComponent, VistaventasrealizadasComponent,
    FiltrosPreciosComponent, ReporteprecioComponent],
  templateUrl: './monitoroperaciones.component.html',
  styleUrl: './monitoroperaciones.component.scss'
})
export class MonitoroperacionesComponent {

  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 50;

  obj_filtros!: MonitorOperacionesFiltros;

  filtrosActuales: any;

  lista_ventasrealizadas: MonitorDetalleVentasRealizadas[] = [];
  lista_precios: MonitorVentaReportePreciosDetalle[] = [];

  reporteSeleccionado = 'ventas';

  kpisData: any = {
    ventas: [],
    precios: []
  };

  constructor(private service: MonitoroperacionesService) { }

  ngOnInit(): void {
    this.cargarFiltros();
  }

  cargarFiltros() {
    this.service.filtrosgenerales().subscribe({
      next: (data) => {
        this.obj_filtros = data;
      },
      error: (err) => {
        console.error('Error cargando filtros', err);
      }
    });
  }

  get currentKpis() {
    return this.kpisData[this.reporteSeleccionado] || [];
  }

  ReporteVentas(filtrosRecibidos: any, event?: PageEvent) {
    this.filtrosActuales = filtrosRecibidos;
    if (event) {
      this.paginaActual = event.pageIndex;
      this.pageSize = event.pageSize;
    } else {
      this.paginaActual = 0;
    }

    this.lista_ventasrealizadas = [];

    this.service.ventasrealizadas(this.paginaActual, this.pageSize, filtrosRecibidos)
      .subscribe(res => {
        this.kpisData['ventas'] = res.kpis;
        this.lista_ventasrealizadas = res.detalles;
        this.totalRegistros = res.totalElements;
      });
  }

  PaginacionReporteVentas(event: PageEvent) {
    this.ReporteVentas(this.filtrosActuales, event);
  }

  ReportePrecios(filtrosRecibidos: any, event?: PageEvent) {
    this.filtrosActuales = filtrosRecibidos;
    if (event) {
      this.paginaActual = event.pageIndex;
      this.pageSize = event.pageSize;
    } else {
      this.paginaActual = 0;
    }

    this.lista_precios = [];

    this.service.reporteprecios(this.paginaActual, this.pageSize, filtrosRecibidos)
      .subscribe(res => {
        this.kpisData['precios'] = res.kpis;
        this.lista_precios = res.detalles;
        this.totalRegistros = res.totalElements;
      });
  }

  PaginacionReportePrecios(event: PageEvent) {
    this.ReportePrecios(this.filtrosActuales, event);
  }
}
