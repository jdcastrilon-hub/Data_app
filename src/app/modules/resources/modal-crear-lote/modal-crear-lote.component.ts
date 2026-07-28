import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { LoteDisponible } from 'src/app/core/interfaces/Bodega/LoteDisponible';
import { ArticuloServiceService } from 'src/app/core/services/Bodega/articulo-service.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';

export interface ModalCrearLoteData {
  idArticulo: number;
  codigoLotePrefill: string;
}

@Component({
  selector: 'modal-crear-lote',
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatButtonModule, MatIconModule, FlexLayoutModule],
  templateUrl: './modal-crear-lote.component.html',
  styleUrl: './modal-crear-lote.component.scss'
})
export class ModalCrearLoteComponent {

  formulario: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private articuloService: ArticuloServiceService,
    private notificacion: NotificacionesService,
    public dialogRef: MatDialogRef<ModalCrearLoteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModalCrearLoteData
  ) {
    this.formulario = this.fb.group({
      codigoLote: [data.codigoLotePrefill, Validators.required],
      fecVencimiento: [null, Validators.required]
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const valores = this.formulario.getRawValue();
    // Solo reserva el id (nextval) - el lote se crea de verdad hasta que se guarde
    // la transaccion que lo use, para no dejar lotes huerfanos si se cancela.
    this.articuloService.reservarLote(this.data.idArticulo, valores.codigoLote).subscribe({
      next: (reservado) => {
        if (reservado.existe) {
          this.guardando = false;
          this.notificacion.showError('Ya existe un lote con ese código para este artículo.');
          return;
        }

        const fecha: Date = valores.fecVencimiento;
        const lotePendiente: LoteDisponible = {
          idLote: reservado.idLote!,
          codigoLote: valores.codigoLote,
          fecVencimiento: fecha.toISOString().substring(0, 10),
          cantidad: 0,
          esNuevo: true
        };
        this.dialogRef.close(lotePendiente);
      },
      error: (err) => {
        this.guardando = false;
        this.notificacion.showError(err.error?.detail || 'No se pudo reservar el lote.');
      }
    });
  }

}
