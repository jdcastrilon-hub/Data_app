import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CdkTreeModule } from '@angular/cdk/tree';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import {MatMenuModule} from '@angular/material/menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,
    MatSidenavModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    CdkTreeModule,RouterModule,MatToolbarModule,MatMenuModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Data_app';
}
