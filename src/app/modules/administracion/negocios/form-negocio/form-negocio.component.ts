import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { NegocioAdmin } from 'src/app/core/models/core/NegocioAdmin';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { NegocioServiceService } from 'src/app/core/services/General/negocio-service.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'app-form-negocio',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatCheckboxModule],
  templateUrl: './form-negocio.component.html',
  styleUrl: './form-negocio.component.scss'
})
export class FormNegocioComponent {

  formulario!: FormGroup;
  objeto!: NegocioAdmin;
  titulo_form!: string;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private negocioService: NegocioServiceService,
    private logAuditoria: AuditoriaService,
    private route: ActivatedRoute,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private dialog: MatDialog,
    private router: Router) {
    this.objeto = new NegocioAdmin();
  }

  volver(): void {
    this.router.navigate(['/administracion']);
  }

  ngOnInit() {
    this.formulario = this.fb.group({
      id: [this.objeto.id],
      idEmpresa: [this.objeto.idEmpresa],
      codNegocio: [this.objeto.codNegocio, Validators.required],
      nomNegocio: [this.objeto.nomNegocio, Validators.required],
      activo: [this.objeto.activo],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE NEGOCIO' : 'ACTUALIZACION NEGOCIO';
        this.ModoEdicion(Number(id));
      } else {
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO NEGOCIO';
        this.objeto = new NegocioAdmin();
        this.formulario.patchValue({
          idEmpresa: this.loginService.getIdEmpresaActual(),
          activo: true
        });
      }
    });
  }

  ModoEdicion(id: number): void {
    this.negocioService.getNegocioById(id).subscribe({
      next: (data: NegocioAdmin) => {
        this.objeto = data;

        this.formulario.patchValue({
          id: data.id,
          idEmpresa: data.idEmpresa,
          codNegocio: data.codNegocio,
          nomNegocio: data.nomNegocio,
          activo: data.activo,
        });

        this.cargarLogsExistentes(data.logs);

        if (this.isReadOnly) {
          this.formulario.disable();
        }
      },
      error: (err) => {
        console.error('Error al cargar el negocio:', err);
        this.router.navigate(['/administracion']);
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

  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - ${this.objeto.codNegocio}`,
        logs: this.formulario.get('logs')?.value
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }

  agregarLogAuditoria() {
    const logData = this.logAuditoria.generarLog(!this.isEditMode ? 'Nuevo' : 'Edicion');

    const auditoriaGroup = this.fb.group({
      operacion: [logData.operacion],
      usuario_mod: [logData.usuario_mod],
      fecha_mod: [logData.fecha_mod]
    });

    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.push(auditoriaGroup);
  }

  enviarFormulario() {
    this.formulario.patchValue({
      fechaMod: new Date().toISOString()
    });

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.agregarLogAuditoria();

    const jsonParaAPI = this.formulario.getRawValue();

    if (this.isEditMode) {
      this.negocioService.edit(this.objeto.id!, jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Negocio editado con éxito!');
          this.router.navigate(['/administracion']);
        },
        error: (err) => {
          console.error('Error al editar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el negocio.');
        }
      });
    } else {
      this.negocioService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Negocio guardado con éxito!');
          this.router.navigate(['/administracion']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el negocio.');
        }
      });
    }
  }

}
