import { Component } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormsModule } from '@angular/forms';
import { MonitorstockService } from 'src/app/core/services/Bodega/monitorstock.service';
import { PageEvent } from '@angular/material/paginator';
import { FiltrostockComponent } from './vistainventario/filtrostock/filtrostock.component';
import { KpistockComponent } from './vistainventario/kpistock/kpistock.component';
import { MonitorStockDisponibleVista1 } from 'src/app/core/interfaces/Bodega/MonitorStockDisponibleVista1';
import { VistaInventarioComponent } from './vistainventario/vista-inventario/vista-inventario.component';
import { MonitorStockFiltroInventario } from 'src/app/core/interfaces/Bodega/MonitorStockFiltroInventario';
import { FiltrosvaloracionComponent } from './vistavaloracion/filtrosvaloracion/filtrosvaloracion.component';
import { VistaValoracionComponent } from './vistavaloracion/vista-valoracion/vista-valoracion.component';
import { ValoracionDisponible } from 'src/app/core/interfaces/Bodega/ValoracionDisponible';
import { FiltrosstockminimoComponent } from './vistastockminimo/filtrosstockminimo/filtrosstockminimo.component';
import { VistaStockminimoComponent } from './vistastockminimo/vista-stockminimo/vista-stockminimo.component';
import { StockMinimoDisponible } from 'src/app/core/interfaces/Bodega/StockMinimoDisponible';
import { FiltrosvencimientosComponent } from './vistavencimientos/filtrosvencimientos/filtrosvencimientos.component';
import { VistaVencimientosComponent } from './vistavencimientos/vista-vencimientos/vista-vencimientos.component';
import { LoteVencimiento } from 'src/app/core/interfaces/Bodega/LoteVencimiento';

@Component({
  selector: 'app-monitorstock',
  imports: [modules_depencias, RouterModule, FormsModule, FiltrostockComponent, KpistockComponent, VistaInventarioComponent,
    FiltrosvaloracionComponent, VistaValoracionComponent, FiltrosstockminimoComponent, VistaStockminimoComponent,
    FiltrosvencimientosComponent, VistaVencimientosComponent],
  templateUrl: './monitorstock.component.html',
  styleUrl: './monitorstock.component.scss'
})
export class MonitorstockComponent {

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 50;

  filtrosActuales: any;

  obj_filtros!: MonitorStockFiltroInventario;

  reporteSeleccionado = 'inventario';

  // Esto simularía los datos que vendrán de tu API en FastAPI
  kpisData: any = {
    inventario: [],
    valoracion: [],
    stockminimo: [],
    vencimientos: []
  };


  lista_inventario: MonitorStockDisponibleVista1[] = [];
  lista_valoracion: ValoracionDisponible[] = [];
  lista_stockminimo: StockMinimoDisponible[] = [];
  lista_vencimientos: LoteVencimiento[] = [];

  //constructor
  constructor(
    private fb: FormBuilder,
    private service: MonitorstockService,
    private router: Router,
    private route: ActivatedRoute
  ) { }


  ngOnInit(): void {
    this.cargarFiltros();
  }

  cargarFiltros() {
    this.service.filtrosvistainventrio().subscribe({
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

  // Este método se ejecuta cuando el hijo emite el evento
  ejecutarLogica(filtrosRecibidos: any, event?: PageEvent) {
    this.filtrosActuales = filtrosRecibidos;
    if (event) {
      this.paginaActual = event.pageIndex;
      this.totalRegistros = event.pageSize;
    }
    console.log('Filtros recibidos del hijo:', filtrosRecibidos);
    console.log('Reporte seleccionado actualmente:', this.reporteSeleccionado);

    this.lista_inventario = [];

    // Aquí es donde llamas a tu servicio de FastAPI
    // Pasando el tipo de reporte y los filtros
    this.service.monitorinventario(this.reporteSeleccionado,
      this.paginaActual,
      this.pageSize,
      filtrosRecibidos)
      .subscribe(res => {
        console.log('Repuesta API:', res);
        this.kpisData[this.reporteSeleccionado] = res.kpis;
        this.lista_inventario = res.detalles;
        this.totalRegistros = res.totalElements;
      });

  }

  get currentKpis() {
    return this.kpisData[this.reporteSeleccionado] || [];
  }


  manejarPaginacion(event: PageEvent) {
    console.log("manejar paginacion")
    // 1. Actualizamos los valores globales según lo que el usuario eligió en el paginador
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;

    // 2. Disparamos la consulta de nuevo
    // Pasamos los filtros actuales (que deberías tener guardados en una variable)
    this.ejecutarLogica(this.filtrosActuales);
  }

  // Este método se ejecuta cuando el hijo (filtrosvaloracion) emite el evento
  ejecutarLogicaValoracion(filtrosRecibidos: any, event?: PageEvent) {
    this.filtrosActuales = filtrosRecibidos;
    if (event) {
      this.paginaActual = event.pageIndex;
      this.totalRegistros = event.pageSize;
    }

    this.lista_valoracion = [];

    this.service.monitorvaloracion(this.paginaActual, this.pageSize, filtrosRecibidos)
      .subscribe(res => {
        this.kpisData['valoracion'] = [
          {
            titulo: 'Valor Total de Inventario',
            valor: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(res.valorTotalInventario),
            icono: 'payments',
            color: '#2e7d32'
          },
          {
            titulo: 'Total de Artículos',
            valor: new Intl.NumberFormat('es-CO').format(res.totalElements),
            icono: 'inventory_2',
            color: '#1976d2'
          }
        ];
        this.lista_valoracion = res.detalles;
        this.totalRegistros = res.totalElements;
      });
  }

  manejarPaginacionValoracion(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.ejecutarLogicaValoracion(this.filtrosActuales);
  }

  // Este método se ejecuta cuando el hijo (filtrosstockminimo) emite el evento
  ejecutarLogicaStockMinimo(filtrosRecibidos: any, event?: PageEvent) {
    this.filtrosActuales = filtrosRecibidos;
    if (event) {
      this.paginaActual = event.pageIndex;
      this.totalRegistros = event.pageSize;
    }

    this.lista_stockminimo = [];

    this.service.monitorstockminimo(this.paginaActual, this.pageSize, filtrosRecibidos)
      .subscribe(res => {
        this.kpisData['stockminimo'] = [
          {
            titulo: 'Artículos en Alerta',
            valor: new Intl.NumberFormat('es-CO').format(res.totalElements),
            icono: 'warning',
            color: '#c62828'
          },
          {
            titulo: 'Unidades Faltantes',
            valor: new Intl.NumberFormat('es-CO').format(res.totalFaltante),
            icono: 'trending_down',
            color: '#ef6c00'
          }
        ];
        this.lista_stockminimo = res.detalles;
        this.totalRegistros = res.totalElements;
      });
  }

  manejarPaginacionStockMinimo(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.ejecutarLogicaStockMinimo(this.filtrosActuales);
  }

  // Este método se ejecuta cuando el hijo (filtrosvencimientos) emite el evento
  ejecutarLogicaVencimientos(filtrosRecibidos: any, event?: PageEvent) {
    this.filtrosActuales = filtrosRecibidos;
    if (event) {
      this.paginaActual = event.pageIndex;
      this.totalRegistros = event.pageSize;
    }

    this.lista_vencimientos = [];

    this.service.monitorvencimientos(this.paginaActual, this.pageSize, filtrosRecibidos)
      .subscribe(res => {
        this.kpisData['vencimientos'] = [
          {
            titulo: 'Lotes por Vencer',
            valor: new Intl.NumberFormat('es-CO').format(res.totalElements),
            icono: 'event_busy',
            color: '#c62828'
          },
          {
            titulo: 'Unidades en Riesgo',
            valor: new Intl.NumberFormat('es-CO').format(res.totalUnidadesEnRiesgo),
            icono: 'inventory_2',
            color: '#ef6c00'
          }
        ];
        this.lista_vencimientos = res.detalles;
        this.totalRegistros = res.totalElements;
      });
  }

  manejarPaginacionVencimientos(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.ejecutarLogicaVencimientos(this.filtrosActuales);
  }

}
