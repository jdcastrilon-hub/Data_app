import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { DetalleUserEmpresa } from 'src/app/core/interfaces/Core/DetalleUserEmpresa';
import { LoginService } from 'src/app/core/services/core/login.service';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';

@Component({
  selector: 'modal-cambiar-empresa',
  imports: [modules_depencias, MatDialogModule, MatRadioModule, FormsModule],
  templateUrl: './modal-cambiar-empresa.component.html',
  styleUrl: './modal-cambiar-empresa.component.scss'
})
export class ModalCambiarEmpresaComponent implements OnInit {

  cargando = true;
  guardando = false;
  empresas: DetalleUserEmpresa[] = [];
  idEmpSeleccionada: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<ModalCambiarEmpresaComponent>,
    private loginService: LoginService,
    private permisosState: PermisosStateService,
    private notificacion: NotificacionesService
  ) {}

  ngOnInit(): void {
    this.idEmpSeleccionada = this.loginService.getIdEmpresaActual();

    this.loginService.misEmpresas().subscribe({
      next: (data) => {
        this.empresas = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando mis empresas', err);
        this.notificacion.showError('No se pudieron cargar tus empresas.');
        this.cargando = false;
      }
    });
  }

  confirmar(): void {
    if (this.idEmpSeleccionada === null) {
      return;
    }

    // Ya esta en esa empresa: no hace falta pedir un token nuevo.
    if (this.idEmpSeleccionada === this.loginService.getIdEmpresaActual()) {
      this.dialogRef.close();
      return;
    }

    this.guardando = true;
    this.loginService.cambiarEmpresa(this.idEmpSeleccionada).subscribe({
      next: () => {
        // El cache de permisos es de la empresa saliente - se invalida antes
        // de recargar para que la app vuelva a pedirlos ya con la nueva.
        this.permisosState.invalidar();
        this.dialogRef.close();
        window.location.reload();
      },
      error: (err) => {
        console.error('Error cambiando de empresa', err);
        this.notificacion.showError('No se pudo cambiar de empresa. Intenta de nuevo.');
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

}
