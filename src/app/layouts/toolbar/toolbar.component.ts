import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LayoutService } from 'src/app/core/services/core/layout.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PreferenciasDialogComponent } from 'src/app/modules/resources/preferencias-dialog/preferencias-dialog.component';

@Component({
  selector: 'toolbar',
  imports: [MatToolbarModule, MatIconModule,MatMenuModule,MatDividerModule,MatButtonModule,MatDialogModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {

  constructor(
    private layoutService: LayoutService,
    private dialog: MatDialog,
    private loginService: LoginService,
    private router: Router
  ) { }

  toggleMenu() {

    this.layoutService.toggleMenu();

  }

  abrirPreferencias() {

    this.dialog.open(PreferenciasDialogComponent, {
      width: '350px'
    });

  }

  cerrarSesion() {

    this.loginService.logout();
    this.router.navigate(['/login']);

  }


}
