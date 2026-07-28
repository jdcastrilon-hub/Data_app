import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VentaServiceService } from 'src/app/core/services/Ventas/venta-service.service';
import { Ventas } from 'src/app/core/models/Ventas/Ventas';

export interface ModalDetalleFacturaData {
  idTrans: number;
}

@Component({
  selector: 'app-modal-detalle-factura',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatProgressSpinnerModule],
  templateUrl: './modal-detalle-factura.component.html',
  styleUrl: './modal-detalle-factura.component.scss'
})
export class ModalDetalleFacturaComponent implements OnInit {

  venta: Ventas | null = null;
  cargando: boolean = true;
  error: boolean = false;

  displayedColumns: string[] = ['articulo', 'cantidad', 'precio', 'total'];

  constructor(
    private dialogRef: MatDialogRef<ModalDetalleFacturaComponent>,
    private ventaService: VentaServiceService,
    @Inject(MAT_DIALOG_DATA) public data: ModalDetalleFacturaData
  ) { }

  ngOnInit(): void {
    this.ventaService.getVentaById(this.data.idTrans).subscribe({
      next: (data) => {
        // El backend no manda "factura" armado (ese campo solo existe en el
        // frontend de venta-directa/venta-pos, calculado al vuelo) - se arma
        // aca igual que alli: serie + numero de documento.
        data.factura = `${data.serie ?? ''}${data.nroDocum ?? ''}`;
        this.venta = data;
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  formatearMoneda(valor: number | null | undefined): string {
    const num = Number(valor) || 0;
    return num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
