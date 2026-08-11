import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { CostoKardexLinea } from 'src/app/core/interfaces/Compras/CostoKardexLinea';
import { MonitorcomprasService } from 'src/app/core/services/Compras/monitorcompras.service';

export interface ModalHistorialCostoData {
  idArticulo: number;
  idBodega: number;
  codArticulo: string;
  nomArticulo: string;
}

@Component({
  selector: 'modal-historial-costo',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule, FlexLayoutModule, MatProgressSpinnerModule],
  templateUrl: './modal-historial-costo.component.html',
  styleUrl: './modal-historial-costo.component.scss'
})
export class ModalHistorialCostoComponent {

  // Kardex de costos: lee s_costovariacion, que ya solo contiene eventos
  // donde el costo promedio realmente cambio - sin filtro de fechas, la
  // tabla origen es chica por construccion (una fila por cambio real en
  // toda la vida del articulo+bodega, no una fila por venta).
  columnasHistorial: string[] = ['fecha', 'documento', 'origen', 'cantidad', 'stockAnterior', 'costoAnterior', 'costoMovimiento', 'costoPromedio', 'variacion', 'usuario'];
  movimientos: CostoKardexLinea[] = [];
  cargando = false;

  constructor(
    public dialogRef: MatDialogRef<ModalHistorialCostoComponent>,
    private service: MonitorcomprasService,
    @Inject(MAT_DIALOG_DATA) public data: ModalHistorialCostoData
  ) { }

  ngOnInit(): void {
    this.cargando = true;
    this.service.costoKardex(this.data.idArticulo, this.data.idBodega).subscribe({
      next: (data) => {
        this.movimientos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando kardex de costos', err);
        this.cargando = false;
      }
    });
  }

  variacion(mov: CostoKardexLinea): number | null {
    if (!mov.costo_anterior) {
      return null;
    }
    return ((mov.costo_nuevo_promedio - mov.costo_anterior) / mov.costo_anterior) * 100;
  }

}
