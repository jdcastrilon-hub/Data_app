import { Component } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { CdkTreeModule } from '@angular/cdk/tree';
import { Router } from '@angular/router';

interface MenuNode {
  name: string;
  children?: MenuNode[];
}

const MENU_DATA: MenuNode[] = [
  {
    name: 'Artículos',
    children: [
      { name: 'Lista de Artículos' },
      { name: 'Nuevo Artículo' },
      { name: 'Factura' }
    ]
  },
  {
    name: 'Clientes',
    children: [
      { name: 'Lista de Clientes' },
      { name: 'Agregar Cliente' }
    ]
  }
];

@Component({
  selector: 'sidenav',
  standalone: true,
  imports: [MatTreeModule,MatIconModule,MatIconModule,MatListModule,CdkTreeModule],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {

  treeControl = new NestedTreeControl<MenuNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<MenuNode>();

  constructor(private router: Router) {
    this.dataSource.data = MENU_DATA;
    console.log("Inicio Sidenav");
    console.log(MENU_DATA.length);
  }

  hasChild = (_: number, node: MenuNode) => !!node.children && node.children.length > 0;

    navigate(node: MenuNode) {
      console.log(node.name);
      // Acá podés usar lógica para mapear el nombre del nodo a una ruta
      if (node.name === 'Lista de Artículos') {
        this.router.navigate(['/categorias']);
      }else if(node.name === 'Nuevo Artículo') {
        this.router.navigate(['/usuario']);
    }else if(node.name==='Factura'){
      this.router.navigate(['/factura']);
    }
  }

}
