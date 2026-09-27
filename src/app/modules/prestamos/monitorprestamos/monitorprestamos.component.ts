import { Component } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { KpiprestamosComponent } from './vistacontratos/kpiprestamos/kpiprestamos.component';
import { FiltroscontratosComponent } from './vistacontratos/filtroscontratos/filtroscontratos.component';
import { VistaContratosComponent } from './vistacontratos/vista-contratos/vista-contratos.component';
import { MonitorprestamosService } from 'src/app/core/services/Prestamos/monitorprestamos.service';
import { ContratoPrestamoMonitor } from 'src/app/core/interfaces/Prestamos/ContratoPrestamoMonitor';

@Component({
  selector: 'app-monitorprestamos',
  imports: [modules_depencias, RouterModule, FormsModule, KpiprestamosComponent, FiltroscontratosComponent, VistaContratosComponent],
  templateUrl: './monitorprestamos.component.html',
  styleUrl: './monitorprestamos.component.scss'
})
export class MonitorprestamosComponent {

  // Un solo "Tipo de Informe" por ahora (Contratos) - el selector queda listo
  // para sumar reportes despues, mismo patron que monitortesoreria. Sin
  // cargarFiltros(): el unico catalogo (estado) es fijo y los clientes se
  // buscan con combo-cliente.
  reporteSeleccionado = 'contratos';

  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;

  filtrosActuales: any;

  lista_contratos: ContratoPrestamoMonitor[] = [];
  kpisData: any[] = [];

  constructor(private service: MonitorprestamosService) { }

  // Nueva consulta (el usuario cambio filtros y le dio "Consultar"): vuelve a la primera pagina.
  consultarContratos(filtrosRecibidos: any) {
    this.paginaActual = 0;
    this.buscarContratos(filtrosRecibidos);
  }

  private buscarContratos(filtrosRecibidos: any) {
    this.filtrosActuales = filtrosRecibidos;
    this.lista_contratos = [];

    this.service.contratos(this.paginaActual, this.pageSize, filtrosRecibidos).subscribe(res => {
      this.kpisData = res.kpis;
      this.lista_contratos = res.detalles;
      this.totalRegistros = res.totalElements;
    });
  }

  paginacionContratos(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.buscarContratos(this.filtrosActuales);
  }
}
