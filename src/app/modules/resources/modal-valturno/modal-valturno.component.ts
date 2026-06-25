import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'modal-valturno',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './modal-valturno.component.html',
  styleUrl: './modal-valturno.component.scss'
})
export class ModalValturnoComponent {
  constructor(
    private dialogRef: MatDialogRef<ModalValturnoComponent>,
    private router: Router
  ) { }

  irAAbrirCaja() {
    this.dialogRef.close();
    this.router.navigate(['/comercial/turnos/abrir']); // Tu ruta de apertura
  }

}
