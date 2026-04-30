import { Component } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { KpicomprasComponent } from './vistacompras/kpicompras/kpicompras.component';
import { FormBuilder, FormsModule } from '@angular/forms';
import { FiltroscomprasComponent } from './vistacompras/filtroscompras/filtroscompras.component';
import { MonitorcomprasService } from 'src/app/core/services/Compras/monitorcompras.service';
import { VistacomprasrealizadasComponent } from './vistacompras/vistacomprasrealizadas/vistacomprasrealizadas.component';
import { monitorDetalleComprasRealizadas } from 'src/app/core/interfaces/Compras/monitorDetalleComprasRealizadas';
import { PageEvent } from '@angular/material/paginator';
import { MonitorComprasFiltros } from 'src/app/core/interfaces/Compras/MonitorComprasFiltros';
import { FiltrosCostosComponent } from './vistacostos/filtros/filtros-costos.component';
import { MonitorCompraReporteCostosDetalle } from 'src/app/core/interfaces/Compras/MonitorCompraReporteCostosDetalle';
import { ReportecostosComponent } from './vistacostos/reportecostos/reportecostos.component';

@Component({
  selector: 'app-monitorcompras',
  imports: [modules_depencias, RouterModule, KpicomprasComponent, FormsModule, FiltroscomprasComponent, VistacomprasrealizadasComponent,
    FiltrosCostosComponent, ReportecostosComponent
  ],
  templateUrl: './monitorcompras.component.html',
  styleUrl: './monitorcompras.component.scss'
})
export class MonitorcomprasComponent {

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 50;

  obj_filtros!: MonitorComprasFiltros;

  filtrosActuales: any;

  //Listas
  lista_comprasrealizadas: monitorDetalleComprasRealizadas[] = [];
  lista_costos: MonitorCompraReporteCostosDetalle[] = [];

  //constructor
  constructor(
    private fb: FormBuilder,
    private service: MonitorcomprasService,
    private router: Router,
    private route: ActivatedRoute
  ) { }


  reporteSeleccionado = 'compras';

  // Esto simularía los datos que vendrán de tu API en FastAPI
  kpisData: any = {
    compras: [],
    variacion: [],
    inventario: []
  };



  ngOnInit(): void {
    this.cargarFiltros();
  }

  cargarFiltros() {
    this.service.filtrosgenerales().subscribe({
      next: (data) => {
        console.log("respuesta API")
        console.log(data);
        //Cargamos lista de empresas
        this.obj_filtros = data;

      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  get currentKpis() {
    return this.kpisData[this.reporteSeleccionado] || [];
  }

  // Este método se ejecuta cuando el hijo emite el evento
  ReporteCompras(filtrosRecibidos: any, event?: PageEvent) {
    this.filtrosActuales = filtrosRecibidos;
    if (event) {
      this.paginaActual = event.pageIndex;
      this.totalRegistros = event.pageSize;
    }
    console.log('Filtros recibidos del hijo:', filtrosRecibidos);
    console.log('Reporte seleccionado actualmente:', this.reporteSeleccionado);

    this.lista_comprasrealizadas = [];

    // Aquí es donde llamas a tu servicio de FastAPI
    // Pasando el tipo de reporte y los filtros
    this.service.monitorcomprasrealizadas(this.reporteSeleccionado,
      this.paginaActual,
      this.pageSize,
      filtrosRecibidos)
      .subscribe(res => {
        console.log('Repuesta API:', res);
        this.kpisData[this.reporteSeleccionado] = res.kpis;
        this.lista_comprasrealizadas = res.detalles;
        this.totalRegistros = res.totalElements;
      });

  }

  // Este método se ejecuta cuando el hijo emite el evento
  ReporteCostos(filtrosRecibidos: any, event?: PageEvent) {
    this.filtrosActuales = filtrosRecibidos;
    if (event) {
      this.paginaActual = event.pageIndex;
      this.totalRegistros = event.pageSize;
    }
    console.log('Filtros recibidos del hijo:', filtrosRecibidos);
    console.log('Reporte seleccionado actualmente:', this.reporteSeleccionado);

    this.lista_costos = [];

    // Aquí es donde llamas a tu servicio de FastAPI
    // Pasando el tipo de reporte y los filtros
    this.service.reportecostos(this.paginaActual,
      this.pageSize,
      filtrosRecibidos)
      .subscribe(res => {
        console.log('Repuesta API:', res);
        this.kpisData[this.reporteSeleccionado] = res.kpis;
        this.lista_costos = res.detalles;
        this.totalRegistros = res.totalElements;
      });

  }


  PaginacionReporteCompras(event: PageEvent) {
    console.log("manejar paginacion")
    // 1. Actualizamos los valores globales según lo que el usuario eligió en el paginador
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;

    // 2. Disparamos la consulta de nuevo
    // Pasamos los filtros actuales (que deberías tener guardados en una variable)
    this.ReporteCompras(this.filtrosActuales);
  }

  PaginacionReporteCostos(event: PageEvent) {
    console.log("manejar paginacion")
    // 1. Actualizamos los valores globales según lo que el usuario eligió en el paginador
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;

    // 2. Disparamos la consulta de nuevo
    // Pasamos los filtros actuales (que deberías tener guardados en una variable)
    this.ReporteCostos(this.filtrosActuales);
  }
}
