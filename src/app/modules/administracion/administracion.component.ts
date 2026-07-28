import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { RouterModule } from '@angular/router';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { RolesComponent } from './roles/roles.component';
import { SucursalesComponent } from './sucursales/sucursales.component';
import { NegociosComponent } from './negocios/negocios.component';
import { PermisosComponent } from './permisos/permisos.component';
import { AdministracionTabStateService } from 'src/app/core/services/core/administracion-tab-state.service';

@Component({
  selector: 'app-administracion',
  imports: [modules_depencias, RouterModule, UsuariosComponent, RolesComponent, SucursalesComponent, NegociosComponent, PermisosComponent],
  templateUrl: './administracion.component.html',
  styleUrl: './administracion.component.scss'
})
export class AdministracionComponent {
  constructor(public tabState: AdministracionTabStateService) { }
}
