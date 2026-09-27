import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContratoPrestamoMonitor } from 'src/app/core/interfaces/Prestamos/ContratoPrestamoMonitor';
import { MonitorprestamosService } from 'src/app/core/services/Prestamos/monitorprestamos.service';
import { ModalKardexCuotasComponent, ModalKardexCuotasData } from '../modal-kardex-cuotas/modal-kardex-cuotas.component';
import { FormPrestamoComponent, FormPrestamoDialogData } from 'src/app/modules/prestamos/form-prestamo/form-prestamo.component';

const STORAGE_KEY_COLUMNAS = 'monitorprestamos_vistacontratos_columnas';

@Component({
  selector: 'vista-contratos',
  standalone: true,
  imports: [CommonModule, MatTableModule, FlexLayoutModule, MatPaginatorModule, MatIconModule, MatTooltipModule,
    MatButtonModule, MatMenuModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './vista-contratos.component.html',
  styleUrl: './vista-contratos.component.scss'
})
export class VistaContratosComponent implements OnInit, OnChanges {

  @Input() datos: ContratoPrestamoMonitor[] = [];
  @Input() totalRegistros: number = 0;
  @Input() pageSize: number = 10;
  @Input() filtrosActuales: any;
  @Output() paginacion = new EventEmitter<PageEvent>();

  exportando = false;

  columnasConfigurables: { clave: string, label: string }[] = [
    { clave: 'fecDesembolso', label: 'Desembolso' },
    { clave: 'fecFin', label: 'Vence' },
    { clave: 'cliente', label: 'Cliente' },
    { clave: 'capital', label: 'Capital' },
    { clave: 'tasaPct', label: 'Tasa %' },
    { clave: 'cuotas', label: 'Cuotas' },
    { clave: 'valorCuota', label: 'Valor Cuota' },
    { clave: 'estado', label: 'Estado' },
    { clave: 'cobrador', label: 'Cobrador' },
  ];
  columnasVisibles: Set<string> = new Set(this.columnasConfigurables.map(c => c.clave));

  displayedColumns: string[] = [];
  pageSizeOptions: number[] = [10, 25, 50, 100];
  dataSource!: MatTableDataSource<ContratoPrestamoMonitor>;

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(private service: MonitorprestamosService, private dialog: MatDialog) { }

  ngOnInit() {
    this.cargarColumnasGuardadas();
    this.validarColumnas();
    this.dataSource = new MatTableDataSource<ContratoPrestamoMonitor>([]);
  }

  cargarColumnasGuardadas(): void {
    const guardadas = localStorage.getItem(STORAGE_KEY_COLUMNAS);
    if (guardadas) {
      this.columnasVisibles = new Set(JSON.parse(guardadas));
    }
  }

  esVisible(clave: string): boolean {
    return this.columnasVisibles.has(clave);
  }

  toggleColumna(clave: string): void {
    if (this.columnasVisibles.has(clave)) {
      this.columnasVisibles.delete(clave);
    } else {
      this.columnasVisibles.add(clave);
    }
    localStorage.setItem(STORAGE_KEY_COLUMNAS, JSON.stringify([...this.columnasVisibles]));
    this.validarColumnas();
  }

  // Nro, Saldo y la accion de kardex siempre visibles (no configurables).
  validarColumnas() {
    const configurablesVisibles = this.columnasConfigurables
      .map(c => c.clave)
      .filter(clave => this.columnasVisibles.has(clave));
    this.displayedColumns = ['position', 'nroDocum', ...configurablesVisibles, 'saldo', 'acciones'];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datos'] && this.dataSource) {
      this.dataSource.data = this.datos || [];
      if (this.table) {
        this.table.renderRows();
      }
    }
  }

  cambioPagina(event: PageEvent) {
    this.paginacion.emit(event);
  }

  verCuotas(el: ContratoPrestamoMonitor): void {
    const data: ModalKardexCuotasData = {
      idTrans: el.idTrans,
      nroDocum: el.nroDocum,
      nomCliente: el.nomCliente ?? ''
    };
    this.dialog.open(ModalKardexCuotasComponent, { width: '800px', maxWidth: '95vw', data });
  }

  // Abre el mismo formulario donde se origino el prestamo (form-prestamo), en
  // modo consulta, como modal encima del monitor: el monitor no se destruye,
  // asi que conserva filtros, pagina y resultados al cerrar.
  verPrestamo(el: ContratoPrestamoMonitor): void {
    const data: FormPrestamoDialogData = { idTrans: el.idTrans };
    // Tamano fijo (no depende de la pestana activa del form): mismo alto en
    // General, Cuotas y Seguimientos.
    this.dialog.open(FormPrestamoComponent, { width: '1100px', maxWidth: '95vw', height: '85vh', autoFocus: false, data });
  }

  exportarExcel(): void {
    this.exportando = true;
    this.service.exportarContratos(this.filtrosActuales || {}).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'contratos_prestamos.xlsx';
        enlace.click();
        window.URL.revokeObjectURL(url);
        this.exportando = false;
      },
      error: (err) => {
        console.error('Error exportando contratos', err);
        this.exportando = false;
      }
    });
  }
}
