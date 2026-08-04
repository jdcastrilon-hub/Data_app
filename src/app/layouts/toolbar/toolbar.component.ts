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
import { MiPerfilDialogComponent } from 'src/app/modules/resources/mi-perfil-dialog/mi-perfil-dialog.component';
import { ModalCambiarEmpresaComponent } from './modal-cambiar-empresa/modal-cambiar-empresa.component';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';
import { DetalleUser } from 'src/app/core/interfaces/Core/DetalleUserLogin';
import { DetalleUserEmpresa } from 'src/app/core/interfaces/Core/DetalleUserEmpresa';

@Component({
  selector: 'toolbar',
  imports: [MatToolbarModule, MatIconModule, MatMenuModule, MatDividerModule, MatButtonModule, MatDialogModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {

  user!: DetalleUser;
  empresa!: DetalleUserEmpresa;

  constructor(
    private layoutService: LayoutService,
    private dialog: MatDialog,
    private loginService: LoginService,
    private permisosState: PermisosStateService,
    private router: Router
  ) {
    this.user = new DetalleUser();
    this.empresa = new DetalleUserEmpresa();
  }

  ngOnInit() {
    this.user = this.loginService.getUsuarioActual() ?? new DetalleUser();
    this.empresa = this.loginService.getEmpresaActual() ?? new DetalleUserEmpresa();
  }

  toggleMenu() {

    this.layoutService.toggleMenu();

  }

  abrirPreferencias() {

    this.dialog.open(PreferenciasDialogComponent, {
      width: '350px'
    });

  }

  abrirCambiarEmpresa() {

    this.dialog.open(ModalCambiarEmpresaComponent, {
      width: '350px'
    });

  }

  abrirMiPerfil() {

    this.dialog.open(MiPerfilDialogComponent, {
      width: '750px',
      maxWidth: '90vw'
    });

  }

  cerrarSesion() {

    this.loginService.logout();
    // El cache de permisos es del usuario/empresa saliente - se invalida para
    // que el proximo login (sin recargar la pagina) no herede permisos ajenos.
    this.permisosState.invalidar();
    this.router.navigate(['/login']);

  }


}
