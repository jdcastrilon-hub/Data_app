import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MovimientoStock } from 'src/app/core/interfaces/Bodega/MovimientoStock';
import { MonitorstockService } from 'src/app/core/services/Bodega/monitorstock.service';

export interface ModalMovimientosData {
  idArticulo: number;
  idCodBarra: number;
  codArticulo: string;
  nomArticulo: string;
  codBarra: string;
}

@Component({
  selector: 'modal-movimientos',
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatTableModule, FlexLayoutModule],
  templateUrl: './modal-movimientos.component.html',
  styleUrl: './modal-movimientos.component.scss'
})
export class ModalMovimientosComponent {

  columnasMovimientos: string[] = ['fec_doc', 'documento', 'nro_docum', 'bodega', 'tipo_movimiento', 'cantidad', 'vista'];
  movimientos: MovimientoStock[] = [];
  cargando = false;

  totalEntradas = 0;
  totalSalidas = 0;
  totalNeto = 0;

  fechaInicial: Date;
  fechaFinal: Date;

  constructor(
    public dialogRef: MatDialogRef<ModalMovimientosComponent>,
    private service: MonitorstockService,
    @Inject(MAT_DIALOG_DATA) public data: ModalMovimientosData
  ) {
    // Rango por defecto: ultimos 30 dias
    this.fechaFinal = new Date();
    this.fechaInicial = new Date();
    this.fechaInicial.setDate(this.fechaInicial.getDate() - 30);
  }

  ngOnInit(): void {
    this.consultar();
  }

  consultar(): void {
    this.cargando = true;
    this.service.kardexArticulo(this.data.idArticulo, this.data.idCodBarra, this.fechaInicial, this.fechaFinal)
      .subscribe({
        next: (data) => {
          this.movimientos = data;
          this.calcularTotales();
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error cargando movimientos', err);
          this.cargando = false;
        }
      });
  }

  calcularTotales(): void {
    this.totalEntradas = this.movimientos
      .filter(m => m.tipo_movimiento === 'Entrada')
      .reduce((acc, m) => acc + m.cantidad, 0);

    this.totalSalidas = this.movimientos
      .filter(m => m.tipo_movimiento === 'Salida')
      .reduce((acc, m) => acc + m.cantidad, 0);

    this.totalNeto = this.totalEntradas - this.totalSalidas;
  }

}
