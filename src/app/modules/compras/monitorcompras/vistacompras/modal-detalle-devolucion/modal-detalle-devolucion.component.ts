import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { DevolucionCompraLinea } from 'src/app/core/interfaces/Compras/DevolucionCompraLinea';
import { MonitorcomprasService } from 'src/app/core/services/Compras/monitorcompras.service';

export interface ModalDetalleDevolucionData {
  idTrans: number;
  numoc: number;
  remito: string;
}

@Component({
  selector: 'modal-detalle-devolucion',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule, FlexLayoutModule, MatProgressSpinnerModule],
  templateUrl: './modal-detalle-devolucion.component.html',
  styleUrl: './modal-detalle-devolucion.component.scss'
})
export class ModalDetalleDevolucionComponent {

  columnasDevolucion: string[] = ['nroDevolucion', 'fecha', 'motivo', 'codBarra', 'nomArticulo', 'lote', 'cantidad', 'costoUnit', 'costoTotal'];
  lineas: DevolucionCompraLinea[] = [];
  cargando = false;

  totalGeneral = 0;

  constructor(
    public dialogRef: MatDialogRef<ModalDetalleDevolucionComponent>,
    private service: MonitorcomprasService,
    @Inject(MAT_DIALOG_DATA) public data: ModalDetalleDevolucionData
  ) { }

  ngOnInit(): void {
    this.consultar();
  }

  consultar(): void {
    this.cargando = true;
    this.service.devolucionesCompra(this.data.idTrans).subscribe({
      next: (data) => {
        this.lineas = data;
        this.totalGeneral = this.lineas.reduce((acc, l) => acc + Number(l.costo_total), 0);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando devoluciones de la compra', err);
        this.cargando = false;
      }
    });
  }

}
