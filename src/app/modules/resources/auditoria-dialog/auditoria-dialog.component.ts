import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Auditoria } from 'src/app/core/models/core/Auditoria';

// Diálogo genérico para mostrar el historial de auditoría (logs) de cualquier
// entidad. Reutilizable en cualquier formulario que tenga un FormArray "logs".
export interface AuditoriaDialogData {
  titulo?: string;
  logs: Auditoria[];
}

@Component({
  selector: 'auditoria-dialog',
  imports: [MatDialogModule, MatButtonModule, MatTableModule],
  templateUrl: './auditoria-dialog.component.html',
  styleUrl: './auditoria-dialog.component.scss'
})
export class AuditoriaDialogComponent {

  columnas: string[] = ['operacion', 'usuario', 'fecha'];

  constructor(
    public dialogRef: MatDialogRef<AuditoriaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AuditoriaDialogData
  ) { }

  // Del más reciente al más antiguo, para que lo primero que se vea sea el último cambio
  get logsOrdenados(): Auditoria[] {
    return [...(this.data.logs ?? [])].reverse();
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
