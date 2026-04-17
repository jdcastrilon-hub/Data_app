import { Component } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormsModule } from '@angular/forms';
import { MonitorstockService } from 'src/app/core/services/Bodega/monitorstock.service';
import { PageEvent } from '@angular/material/paginator';
import { FiltrostockComponent } from './filtrostock/filtrostock.component';
import { KpistockComponent } from './kpistock/kpistock.component';
import { MonitorStockDisponibleVista1 } from 'src/app/core/interfaces/Bodega/MonitorStockDisponibleVista1';
import { VistaInventarioComponent } from './vista-inventario/vista-inventario.component';
import { MonitorStockFiltroInventario } from 'src/app/core/interfaces/Bodega/MonitorStockFiltroInventario';

@Component({
  selector: 'app-monitorstock',
  imports: [modules_depencias, RouterModule, FormsModule, FiltrostockComponent, KpistockComponent, VistaInventarioComponent],
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
    compras: [],
    variacion: [],
    inventario: []
  };


  lista_inventario: MonitorStockDisponibleVista1[] = [];

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

}
