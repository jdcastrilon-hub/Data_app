import { Component } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { KpicomprasComponent } from './kpicompras/kpicompras.component';
import { FormBuilder, FormsModule } from '@angular/forms';
import { FiltroscomprasComponent } from './filtroscompras/filtroscompras.component';
import { MonitorcomprasService } from 'src/app/core/services/Compras/monitorcompras.service';
import { VistacomprasrealizadasComponent } from './vistacomprasrealizadas/vistacomprasrealizadas.component';
import { monitorDetalleComprasRealizadas } from 'src/app/core/interfaces/Compras/monitorDetalleComprasRealizadas';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-monitorcompras',
  imports: [modules_depencias, RouterModule, KpicomprasComponent, FormsModule, FiltroscomprasComponent, VistacomprasrealizadasComponent],
  templateUrl: './monitorcompras.component.html',
  styleUrl: './monitorcompras.component.scss'
})
export class MonitorcomprasComponent {

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 50;

  filtrosActuales : any;

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

  lista_comprasrealizadas: monitorDetalleComprasRealizadas[] = [];

  get currentKpis() {
    return this.kpisData[this.reporteSeleccionado] || [];
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
