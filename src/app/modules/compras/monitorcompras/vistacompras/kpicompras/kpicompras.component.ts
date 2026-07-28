import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'kpicompras',
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './kpicompras.component.html',
  styleUrl: './kpicompras.component.scss'
})
export class KpicomprasComponent {
  @Input() titulo: string = '';
  @Input() valor: string = '';
  @Input() icono: string = '';
  @Input() color: string = '#3f51b5'; // Color por defecto (Indigo)

}
