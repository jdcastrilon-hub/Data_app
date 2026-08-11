import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { PrecioHistorialLinea } from 'src/app/core/interfaces/Comercial/PrecioHistorialLinea';
import { MonitoroperacionesService } from 'src/app/core/services/Ventas/monitoroperaciones.service';

export interface ModalHistorialPrecioData {
  idArticulo: number;
  idLista: number;
  codArticulo: string;
  nomArticulo: string;
}

@Component({
  selector: 'modal-historial-precio',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule, FlexLayoutModule, MatProgressSpinnerModule],
  templateUrl: './modal-historial-precio.component.html',
  styleUrl: './modal-historial-precio.component.scss'
})
export class ModalHistorialPrecioComponent {

  // p_precios es el ledger completo (nunca promedia, cada fila ya es un
  // movimiento real de precio) - sin filtro de fechas, se trae todo el historial.
  columnasHistorial: string[] = ['fecha', 'documento', 'origen', 'precioAnterior', 'precioNuevo', 'variacion', 'usuario'];
  movimientos: PrecioHistorialLinea[] = [];
  cargando = false;

  constructor(
    public dialogRef: MatDialogRef<ModalHistorialPrecioComponent>,
    private service: MonitoroperacionesService,
    @Inject(MAT_DIALOG_DATA) public data: ModalHistorialPrecioData
  ) { }

  ngOnInit(): void {
    this.cargando = true;
    this.service.precioHistorial(this.data.idArticulo, this.data.idLista).subscribe({
      next: (data) => {
        this.movimientos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando historial de precios', err);
        this.cargando = false;
      }
    });
  }

  variacion(mov: PrecioHistorialLinea): number | null {
    if (!mov.precioAnterior) {
      return null;
    }
    return ((mov.precioNuevo - mov.precioAnterior) / mov.precioAnterior) * 100;
  }

}
