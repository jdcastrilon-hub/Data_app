import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTreeModule } from '@angular/material/tree';
import { Router, RouterModule } from '@angular/router';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Menu } from 'src/app/core/interfaces/Core/Menu';
import { MenuService } from 'src/app/core/services/core/menu.service';

@Component({
  selector: 'menutree',
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatTreeModule,
    MatIconModule],
  templateUrl: './menutree.component.html',
  styleUrl: './menutree.component.scss'
})
export class MenutreeComponent {
  menus: Menu[] = [];
  treeControl = new NestedTreeControl<Menu>(node => node.children);
  dataSource = new MatTreeNestedDataSource<Menu>();

  constructor(
    private menuService: MenuService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarMenu();
  }

  cargarMenu(): void {
    this.menuService.obtenerMenu().subscribe({
      next: (data) => {
        this.menus = data;

        this.dataSource.data = data;
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  seleccionar(node: Menu) {
    if (node.children?.length) {
      this.treeControl.toggle(node);
      return;
    }
    this.router.navigate([node.ruta]);

  }

  hasChild = (_: number, node: Menu) =>
    !!node.children && node.children.length > 0;

  abrirNuevaPestana(node: Menu, event: MouseEvent) {

    event.stopPropagation();

    const url = this.router.serializeUrl(
      this.router.createUrlTree([node.ruta])
    );

    window.open(url, '_blank');

  }

}
