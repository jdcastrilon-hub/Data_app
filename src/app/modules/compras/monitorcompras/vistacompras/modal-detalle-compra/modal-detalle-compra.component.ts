import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { DetalleCompraLinea } from 'src/app/core/interfaces/Compras/DetalleCompraLinea';
import { MonitorcomprasService } from 'src/app/core/services/Compras/monitorcompras.service';

export interface ModalDetalleCompraData {
  idTrans: number;
  numoc: number;
  remito: string;
}

@Component({
  selector: 'modal-detalle-compra',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule, FlexLayoutModule, MatProgressSpinnerModule],
  templateUrl: './modal-detalle-compra.component.html',
  styleUrl: './modal-detalle-compra.component.scss'
})
export class ModalDetalleCompraComponent {

  columnasDetalle: string[] = ['codBarra', 'nomArticulo', 'lote', 'costo', 'cantidad', 'neto', 'porcDcto', 'importeDcto', 'porcIva', 'importeIva', 'total'];
  lineas: DetalleCompraLinea[] = [];
  cargando = false;

  totalGeneral = 0;

  constructor(
    public dialogRef: MatDialogRef<ModalDetalleCompraComponent>,
    private service: MonitorcomprasService,
    @Inject(MAT_DIALOG_DATA) public data: ModalDetalleCompraData
  ) { }

  ngOnInit(): void {
    this.consultar();
  }

  consultar(): void {
    this.cargando = true;
    this.service.detalleCompra(this.data.idTrans).subscribe({
      next: (data) => {
        this.lineas = data;
        this.totalGeneral = this.lineas.reduce((acc, l) => acc + Number(l.total), 0);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando detalle de compra', err);
        this.cargando = false;
      }
    });
  }

}
