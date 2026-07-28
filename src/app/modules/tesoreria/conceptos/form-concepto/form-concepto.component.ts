import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioSearch } from 'src/app/core/interfaces/Core/UsuarioSearch';
import { Conceptos } from 'src/app/core/models/Tesoreria/Conceptos';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { ConceptosService } from 'src/app/core/services/Tesoreria/conceptos.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';
import { ComboUsuarioComponent } from 'src/app/modules/resources/combo-usuario/combo-usuario.component';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-form-concepto',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatCheckboxModule, MatRadioModule, ComboUsuarioComponent],
  templateUrl: './form-concepto.component.html',
  styleUrl: './form-concepto.component.scss'
})
export class FormConceptoComponent {

  formulario!: FormGroup;
  objeto!: Conceptos;
  titulo_form: string = 'REGISTRO DE CONCEPTO';
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  //Grilla de usuarios asignados
  dataSourceUsuarios = new MatTableDataSource<FormGroup>();
  columnasUsuarios: string[] = ['usuario', 'nombre', 'acciones'];

  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private conceptosService: ConceptosService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router) {
    this.objeto = new Conceptos();
  }

  volver(): void {
    this.router.navigate(['/conceptos']);
  }

  ngOnInit() {
    this.formulario = this.fb.group({
      id: [this.objeto.id],
      idEmp: [this.objeto.idEmp],
      nomConcepto: [this.objeto.nomConcepto, Validators.required],
      signo: [this.objeto.signo ?? 1, Validators.required],
      status: [this.objeto.status ?? true],
      aplicaLimit: [this.objeto.aplicaLimit ?? false],
      impLimit: [{ value: this.objeto.impLimit ?? null, disabled: true }],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
      usuarios: this.fb.array([])
    });

    // El campo Importe Limite solo aplica si "Aplica Limite" esta activo.
    this.formulario.get('aplicaLimit')?.valueChanges.subscribe((activo: boolean) => {
      this.aplicarLogicaLimite(activo);
    });
    this.aplicarLogicaLimite(this.formulario.get('aplicaLimit')?.value);

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE CONCEPTO' : 'ACTUALIZACION CONCEPTO';
        this.ModoEdicion(Number(id));
      } else {
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO DE CONCEPTO';
        this.objeto = new Conceptos();
        this.formulario.patchValue({ idEmp: this.loginService.getIdEmpresaActual() });
      }
    });
  }

  // Importe Limite solo es relevante si aplicaLimit esta activo: al desmarcarlo se
  // bloquea y se limpia (mismo patron que horasTurno en form-caja).
  aplicarLogicaLimite(activo: boolean): void {
    if (this.isReadOnly) {
      return; // En modo vista formulario.disable() ya se encarga de todo.
    }

    if (activo) {
      this.formulario.get('impLimit')?.enable();
    } else {
      this.formulario.get('impLimit')?.disable();
      this.formulario.patchValue({ impLimit: null });
    }
  }

  //Metodos de la grilla de usuarios asignados

  get usuarios(): FormArray {
    return this.formulario.get('usuarios') as FormArray;
  }

  crearUsuarioForm(usuario: UsuarioSearch): FormGroup {
    return this.fb.group({
      idUsuario: [usuario.idUsuario, Validators.required],
      usuario: [usuario.usuario],
      nombreCompleto: [usuario.nombreCompleto]
    });
  }

  onUsuarioSeleccionado(usuario: UsuarioSearch): void {
    if (!usuario) {
      return;
    }
    const yaExiste = this.usuarios.controls.some(c => c.value.idUsuario === usuario.idUsuario);
    if (yaExiste) {
      this.notificacion.showError('Ese usuario ya esta asignado al concepto.');
      return;
    }
    this.usuarios.push(this.crearUsuarioForm(usuario));
    this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];
  }

  eliminarUsuario(index: number): void {
    this.usuarios.removeAt(index);
    this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];
  }

  //Metodo para cargar el concepto que viene para edicion/visualizacion
  ModoEdicion(id: number): void {
    this.conceptosService.getConceptoById(id).subscribe({
      next: (data: Conceptos) => {
        this.objeto = data;

        this.cargarLogsExistentes(data.logs);

        this.formulario.patchValue({
          id: data.id,
          idEmp: data.idEmp,
          nomConcepto: data.nomConcepto,
          signo: data.signo,
          status: data.status,
          aplicaLimit: data.aplicaLimit,
          impLimit: data.impLimit
        });

        this.usuarios.clear();
        (data.usuarios || []).forEach(u => this.usuarios.push(this.crearUsuarioForm({
          idUsuario: u.idUsuario,
          usuario: u.usuario.usuario,
          nombreCompleto: u.usuario.nombreCompleto
        })));
        this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];

        if (this.isReadOnly) {
          this.formulario.disable();
        }
      },
      error: (err) => {
        console.error('Error al cargar el concepto:', err);
        this.router.navigate(['/conceptos']);
      }
    });
  }

  // Carga el historial de auditoria ya existente en el FormArray, para que al editar
  // se acumule (en vez de que agregarLogAuditoria() sobrescriba todo el historial).
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
        titulo: `Historial de Auditoría - ${this.objeto.nomConcepto}`,
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

    const dataCompleta = this.formulario.getRawValue();
    const jsonParaAPI = {
      ...dataCompleta,
      usuarios: (dataCompleta.usuarios as { idUsuario: number }[]).map(u => ({ idUsuario: u.idUsuario }))
    };

    if (this.isEditMode) {
      this.conceptosService.edit(this.objeto.id!, jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Concepto actualizado con éxito!');
          this.router.navigate(['/conceptos']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el concepto.');
        }
      });
    } else {
      this.conceptosService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Concepto guardado con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el concepto.');
        }
      });
    }
  }

  resetCampos() {
    this.objeto = new Conceptos();
    this.formDirective.resetForm();
    this.usuarios.clear();
    this.dataSourceUsuarios.data = [];
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    this.formulario.patchValue({ idEmp: this.loginService.getIdEmpresaActual(), signo: 1, status: true });
    this.aplicarLogicaLimite(false);
  }

}
