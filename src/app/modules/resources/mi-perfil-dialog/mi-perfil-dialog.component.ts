import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { PersonaComponent } from 'src/app/modules/Comercial/resources/persona/persona.component';
import { MiPerfil, MiPerfilRol } from 'src/app/core/interfaces/Core/MiPerfil';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { UsuariosService } from 'src/app/core/services/core/usuarios.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';

@Component({
  selector: 'app-mi-perfil-dialog',
  imports: [modules_depencias, ReactiveFormsModule, FormsModule, FlexLayoutModule,
    MatDialogModule, MatChipsModule, PersonaComponent],
  templateUrl: './mi-perfil-dialog.component.html',
  styleUrl: './mi-perfil-dialog.component.scss'
})
export class MiPerfilDialogComponent {

  formulario!: FormGroup;
  roles: MiPerfilRol[] = [];

  // Arranca en Ver (dato propio, pantalla chica) - el lapiz habilita edicion,
  // mismo patron que "Mi Empresa".
  isReadOnly = true;
  cargando = true;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuariosService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService
  ) { }

  ngOnInit() {
    this.formulario = this.fb.group({
      usuario: [{ value: '', disabled: true }],
      nomUsuario: [{ value: '', disabled: true }],
      persona: PersonaComponent.crearFormGroup(),
      fechaMod: [null],
      logs: this.fb.array([])
    });
    this.personaGroup.disable({ emitEvent: false });

    this.cargarPerfil();
  }

  get personaGroup(): FormGroup {
    return this.formulario.get('persona') as FormGroup;
  }

  cargarPerfil(): void {
    this.cargando = true;
    this.usuarioService.getMiPerfil().subscribe({
      next: (data: MiPerfil) => {
        this.roles = data.roles ?? [];
        this.formulario.patchValue({
          usuario: data.usuario,
          nomUsuario: data.nomUsuario,
        });
        this.personaGroup.patchValue({
          ...data.persona,
          fechaNacimiento: data.persona.fechaNacimiento ? new Date(data.persona.fechaNacimiento) : null,
        }, { emitEvent: false });
        this.cargarLogsExistentes(data.logs);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar el perfil:', err);
        this.notificacion.showError('No se pudo cargar tu perfil.');
        this.cargando = false;
      }
    });
  }

  cargarLogsExistentes(logs: Auditoria[]): void {
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    (logs ?? []).forEach(log => {
      logsArray.push(this.fb.group({
        operacion: [log.operacion],
        usuario_mod: [log.usuario_mod],
        fecha_mod: [log.fecha_mod]
      }));
    });
  }

  activarEdicion(): void {
    this.isReadOnly = false;
    this.formulario.enable({ emitEvent: false });
    // El nombre de usuario no es editable (cambiarlo aca podria romper el
    // login) - queda bloqueado aunque el resto del formulario se habilite.
    this.formulario.get('usuario')?.disable({ emitEvent: false });
  }

  cancelarEdicion(): void {
    this.isReadOnly = true;
    this.cargarPerfil();
    this.formulario.disable({ emitEvent: false });
  }

  private agregarLogAuditoria() {
    const logData = this.logAuditoria.generarLog('Edicion');
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.push(this.fb.group({
      operacion: [logData.operacion],
      usuario_mod: [logData.usuario_mod],
      fecha_mod: [logData.fecha_mod]
    }));
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.formulario.patchValue({ fechaMod: new Date().toISOString() });
    this.agregarLogAuditoria();

    const dataCompleta = this.formulario.getRawValue();
    const jsonParaAPI = {
      ...dataCompleta,
      persona: PersonaComponent.aPayload(dataCompleta.persona),
    };

    this.usuarioService.updateMiPerfil(jsonParaAPI).subscribe({
      next: () => {
        this.notificacion.showSuccess('¡Perfil actualizado con éxito!');
        this.isReadOnly = true;
        this.formulario.disable({ emitEvent: false });
        this.cargarPerfil();
      },
      error: (err) => {
        console.error('Error al guardar el perfil:', err);
        this.notificacion.showError(err.error?.message || 'No se pudo actualizar el perfil.');
      }
    });
  }

}
