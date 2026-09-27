import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'kpiprestamos',
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './kpiprestamos.component.html',
  styleUrl: './kpiprestamos.component.scss'
})
export class KpiprestamosComponent {
  @Input() titulo: string = '';
  @Input() valor: string = '';
  @Input() icono: string = '';
  @Input() color: string = '#3f51b5'; // Color por defecto (Indigo)
}
