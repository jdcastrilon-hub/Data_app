import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { Menu } from 'src/app/core/interfaces/Core/Menu';

@Component({
  selector: 'menu-item',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule
  ],
  templateUrl: './menu-item-component.component.html',
  styleUrl: './menu-item-component.component.scss'
})
export class MenuItemComponentComponent {

  @Input()
  menu!: Menu;

}
