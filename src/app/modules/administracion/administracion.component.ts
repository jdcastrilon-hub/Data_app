import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { RouterModule } from '@angular/router';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { RolesComponent } from './roles/roles.component';
import { SucursalesComponent } from './sucursales/sucursales.component';
import { NegociosComponent } from './negocios/negocios.component';
import { PermisosComponent } from './permisos/permisos.component';
import { MiEmpresaComponent } from './mi-empresa/mi-empresa.component';
import { ModulosComponent } from './modulos/modulos.component';
import { AdministracionTabStateService } from 'src/app/core/services/core/administracion-tab-state.service';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';

// Codigo del formulario en md_menu (matriz de permisos) - controla si se
// muestra la pestana "Modulos". A diferencia de las demas pestanas de
// Administracion (sin gate todavia), esta si tiene enforcement real en el
// backend, asi que la ocultamos del lado del cliente tambien.
const MENU_CODIGO_MODULOS = 'ADM_MOD';

@Component({
  selector: 'app-administracion',
  imports: [modules_depencias, RouterModule, UsuariosComponent, RolesComponent, SucursalesComponent, NegociosComponent, PermisosComponent, MiEmpresaComponent, ModulosComponent],
  templateUrl: './administracion.component.html',
  styleUrl: './administracion.component.scss'
})
export class AdministracionComponent {
  puedeVerModulos = false;

  constructor(
    public tabState: AdministracionTabStateService,
    private permisosState: PermisosStateService
  ) { }

  ngOnInit() {
    this.permisosState.cargar().subscribe(() => {
      this.puedeVerModulos = this.permisosState.tienePermiso(MENU_CODIGO_MODULOS, 'VER');
    });
  }
}
