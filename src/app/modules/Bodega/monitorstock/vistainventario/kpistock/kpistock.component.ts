import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'kpistock',
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './kpistock.component.html',
  styleUrl: './kpistock.component.scss'
})
export class KpistockComponent {
  @Input() titulo: string = '';
  @Input() valor: string = '';
  @Input() icono: string = '';
  @Input() color: string = '#3f51b5'; // Color por defecto (Indigo)

}
