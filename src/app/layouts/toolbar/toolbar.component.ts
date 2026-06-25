import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LayoutService } from 'src/app/core/services/core/layout.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'toolbar',
  imports: [MatToolbarModule, MatIconModule,MatMenuModule,MatDividerModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {

  constructor(
    private layoutService: LayoutService
  ) { }

  toggleMenu() {

    this.layoutService.toggleMenu();

  }


}
