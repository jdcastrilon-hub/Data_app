import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { HistorialAjusteCosto } from 'src/app/core/interfaces/Compras/HistorialAjusteCosto';
import { AjustecostoService } from 'src/app/core/services/Compras/ajustecosto.service';

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

  columnasHistorial: string[] = ['fecha', 'costoActual', 'costoNuevo', 'variacion', 'observaciones', 'usuario'];
  ajustes: HistorialAjusteCosto[] = [];
  cargando = false;

  constructor(
    public dialogRef: MatDialogRef<ModalHistorialCostoComponent>,
    private service: AjustecostoService,
    @Inject(MAT_DIALOG_DATA) public data: ModalHistorialCostoData
  ) { }

  ngOnInit(): void {
    this.consultar();
  }

  consultar(): void {
    this.cargando = true;
    this.service.historial(this.data.idArticulo, this.data.idBodega).subscribe({
      next: (data) => {
        this.ajustes = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando historial de ajustes', err);
        this.cargando = false;
      }
    });
  }

  variacion(ajuste: HistorialAjusteCosto): number | null {
    if (!ajuste.costo_actual) {
      return null;
    }
    return ((ajuste.costo_nuevo - ajuste.costo_actual) / ajuste.costo_actual) * 100;
  }

}
