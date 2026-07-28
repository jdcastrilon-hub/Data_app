import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

export interface ModalValturnoData {
  titulo: string;
  mensaje: string;
  textoBoton: string;
  ruta: string;
}

const DATA_POR_DEFECTO: ModalValturnoData = {
  titulo: 'Caja Cerrada',
  mensaje: 'No tienes un turno abierto para el día de hoy. Debes abrir caja.',
  textoBoton: 'Abrir Caja Ahora',
  ruta: '/turno/new'
};

@Component({
  selector: 'modal-valturno',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './modal-valturno.component.html',
  styleUrl: './modal-valturno.component.scss'
})
export class ModalValturnoComponent {

  data: ModalValturnoData;

  constructor(
    private dialogRef: MatDialogRef<ModalValturnoComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) data: Partial<ModalValturnoData>
  ) {
    // Si no se pasa data (uso historico del modal, "sin turno"), se mantiene el
    // mismo texto/ruta que ya tenia por defecto.
    this.data = { ...DATA_POR_DEFECTO, ...data };
  }

  irARuta() {
    this.dialogRef.close();
    this.router.navigate([this.data.ruta]);
  }

}
