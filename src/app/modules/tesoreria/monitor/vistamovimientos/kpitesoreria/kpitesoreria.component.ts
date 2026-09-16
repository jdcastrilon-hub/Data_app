import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'kpitesoreria',
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './kpitesoreria.component.html',
  styleUrl: './kpitesoreria.component.scss'
})
export class KpitesoreriaComponent {
  @Input() titulo: string = '';
  @Input() valor: string = '';
  @Input() icono: string = '';
  @Input() color: string = '#3f51b5'; // Color por defecto (Indigo)
}
