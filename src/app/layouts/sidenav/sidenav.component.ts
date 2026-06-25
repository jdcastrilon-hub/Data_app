import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Menu } from 'src/app/core/interfaces/Core/Menu';
import { MenuService } from 'src/app/core/services/core/menu.service';
import { MenuItemComponentComponent } from './menu-item-component/menu-item-component.component';



@Component({
  selector: 'sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatExpansionModule,
    MatToolbarModule,
    MatSidenavModule,
    MenuItemComponentComponent,
    MatListModule,
    MatIconModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {
  menus: Menu[] = [];

  //constructor
  constructor(
    private menuService: MenuService
  ) { }

  ngOnInit(): void {
    this.cargarMenu();
  }

  cargarMenu(): void {
    this.menuService.obtenerMenu().subscribe({
      next: (data) => {
        this.menus = data;
        console.log(this.menus);
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

}
