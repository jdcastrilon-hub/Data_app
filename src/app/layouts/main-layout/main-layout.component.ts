import { Component, ViewChild } from '@angular/core';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MenutreeComponent } from '../menutree/menutree.component';
import { RouterModule } from '@angular/router';
import { LayoutService } from 'src/app/core/services/core/layout.service';

@Component({
  selector: 'app-main-layout',
  imports: [MatSidenavModule, ToolbarComponent, MenutreeComponent, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  @ViewChild('sidenav')
  sidenav!: MatSidenav;

  constructor(
    private layoutService: LayoutService
  ) { }

  ngOnInit(){

    this.layoutService.toggleMenu$.subscribe(() => {

        this.sidenav.toggle();

    });

}

}
