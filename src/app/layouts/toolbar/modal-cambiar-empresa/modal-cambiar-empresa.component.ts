import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { DetalleUserEmpresa } from 'src/app/core/interfaces/Core/DetalleUserEmpresa';
import { LoginService } from 'src/app/core/services/core/login.service';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';

@Component({
  selector: 'modal-cambiar-empresa',
  imports: [modules_depencias, MatDialogModule, MatRadioModule, MatCheckboxModule, FormsModule],
  templateUrl: './modal-cambiar-empresa.component.html',
  styleUrl: './modal-cambiar-empresa.component.scss'
})
export class ModalCambiarEmpresaComponent implements OnInit {

  cargando = true;
  guardando = false;
  empresas: DetalleUserEmpresa[] = [];
  idEmpSeleccionada: number | null = null;
  // Opt-in siempre en false: no se re-marca la principal en silencio solo por
  // abrir el modal, el usuario lo decide cada vez.
  marcarComoPrincipal = false;

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

    const idEmp = this.idEmpSeleccionada;
    const requiereCambio = idEmp !== this.loginService.getIdEmpresaActual();
    this.guardando = true;

    if (requiereCambio) {
      this.loginService.cambiarEmpresa(idEmp).subscribe({
        next: () => this.marcarPrincipalSiAplica(idEmp, true),
        error: (err) => this.manejarError('No se pudo cambiar de empresa. Intenta de nuevo.', err)
      });
    } else {
      // Ya esta en esa empresa: no hace falta pedir un token nuevo, pero igual
      // puede querer marcarla como principal.
      this.marcarPrincipalSiAplica(idEmp, false);
    }
  }

  private marcarPrincipalSiAplica(idEmp: number, huboCambioDeEmpresa: boolean): void {
    if (!this.marcarComoPrincipal) {
      this.finalizar(huboCambioDeEmpresa);
      return;
    }
    this.loginService.marcarEmpresaPrincipal(idEmp).subscribe({
      next: () => this.finalizar(huboCambioDeEmpresa),
      error: (err) => this.manejarError('No se pudo marcar la empresa como principal.', err)
    });
  }

  private finalizar(huboCambioDeEmpresa: boolean): void {
    if (huboCambioDeEmpresa) {
      // El cache de permisos es de la empresa saliente - se invalida antes
      // de recargar para que la app vuelva a pedirlos ya con la nueva.
      this.permisosState.invalidar();
      this.dialogRef.close();
      window.location.reload();
    } else {
      this.dialogRef.close();
    }
  }

  private manejarError(mensaje: string, err: any): void {
    console.error(mensaje, err);
    this.notificacion.showError(mensaje);
    this.guardando = false;
  }

  cancelar(): void {
    this.dialogRef.close();
  }

}
