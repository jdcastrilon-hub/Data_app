import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MenuService } from 'src/app/core/services/core/menu.service';
import { Menu } from 'src/app/core/interfaces/Core/Menu';

@Component({
  selector: 'navbar',
  standalone: true,
  imports: [MatToolbarModule, RouterModule, MatIconModule, MatMenuModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

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
