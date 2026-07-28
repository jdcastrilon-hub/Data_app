import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'kpiventas',
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './kpiventas.component.html',
  styleUrl: './kpiventas.component.scss'
})
export class KpiventasComponent {
  @Input() titulo: string = '';
  @Input() valor: string = '';
  @Input() icono: string = '';
  @Input() color: string = '#3f51b5';
}
