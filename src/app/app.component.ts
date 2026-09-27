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
import { ThemeService } from './core/services/core/theme.service';
import { LoginService } from './core/services/core/login.service';

@Component({
  selector: 'app-root',
  standalone: true,
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

  constructor(private themeService: ThemeService, private loginService: LoginService) {
    // Recarga esta pestaña si la empresa activa (o la sesión) cambia en otra
    // pestaña del mismo navegador — ver login.service.ts::sincronizarEntrePestañas.
    this.loginService.sincronizarEntrePestañas();
  }
}
