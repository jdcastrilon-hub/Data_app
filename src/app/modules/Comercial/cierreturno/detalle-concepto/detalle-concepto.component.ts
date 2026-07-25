import { Component, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DetalleConceptoLinea } from 'src/app/core/interfaces/Comercial/DetalleConceptoLinea';
import { ModalDetalleFacturaComponent } from '../modal-detalle-factura/modal-detalle-factura.component';

@Component({
  selector: 'app-detalle-concepto',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './detalle-concepto.component.html',
  styleUrl: './detalle-concepto.component.scss'
})
export class DetalleConceptoComponent {

  @Input() lineas: DetalleConceptoLinea[] = [];
  @Input() cargando: boolean = false;

  constructor(private dialog: MatDialog) { }

  // Todas las lineas de una misma tabla comparten concepto (se cargan para UN
  // solo concepto/medio/signo a la vez), asi que basta con mirar la primera
  // fila para saber si esto es una lista de facturas o de movimientos de caja.
  get esFactura(): boolean {
    return this.lineas[0]?.tipo === 'Factura';
  }

  get displayedColumns(): string[] {
    return this.esFactura
      ? ['factura', 'hora', 'cliente', 'importe', 'acciones']
      : ['factura', 'hora', 'cliente', 'importe'];
  }

  get etiquetaFactura(): string {
    return this.esFactura ? 'Factura' : 'Concepto';
  }

  get etiquetaCliente(): string {
    return this.esFactura ? 'Cliente' : 'Observación';
  }

  verDetalleFactura(linea: DetalleConceptoLinea): void {
    this.dialog.open(ModalDetalleFacturaComponent, {
      width: '650px',
      data: { idTrans: linea.idTrans }
    });
  }

  formatearMoneda(valor: number | null | undefined): string {
    const num = Number(valor) || 0;
    return num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatearHora(fecha: string): string {
    const f = new Date(fecha);
    return f.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  // Solo hay diferencia entre lo que aporto esta linea y el total real de la
  // factura cuando esa venta se pago con mas de un medio (pago mixto).
  esPagoParcial(linea: DetalleConceptoLinea): boolean {
    return Math.abs(linea.importeTotalFactura - linea.importe) > 0.01;
  }
}
