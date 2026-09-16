import { Component, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsuarioSearch } from 'src/app/core/interfaces/Core/UsuarioSearch';
import { Banco } from 'src/app/core/models/Tesoreria/Banco';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { BancosService } from 'src/app/core/services/Tesoreria/bancos.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';
import { ComboUsuarioComponent } from 'src/app/modules/resources/combo-usuario/combo-usuario.component';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-form-banco',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatCheckboxModule, ComboUsuarioComponent],
  templateUrl: './form-banco.component.html',
  styleUrl: './form-banco.component.scss'
})
export class FormBancoComponent {

  formulario!: FormGroup;
  titulo_form!: string;

  //parametros de entrada
  objeto!: Banco;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  //Grilla de usuarios asignados (colocada al final del tab "Datos Generales", no
  //en un tab propio - a diferencia de Cajas/Conceptos, Bancos no tiene tanta
  //informacion como para justificar un segundo tab).
  dataSourceUsuarios = new MatTableDataSource<FormGroup>();
  columnasUsuarios: string[] = ['usuario', 'nombre', 'acciones'];

  // Referencia al FormGroupDirective: resetForm() limpia también el estado
  // "submitted", que formulario.reset() no toca.
  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(
    private fb: FormBuilder,
    private bancoService: BancosService,
    private loginService: LoginService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.objeto = new Banco();
  }

  // Vuelve al listado. El filtro/pagina en el que se quedo la lista se restaura
  // desde BancoListStateService (no desde el historial del navegador: se puede
  // llegar a este formulario desde cualquier otra pantalla, no solo desde la lista).
  volver(): void {
    this.router.navigate(['/bancos']);
  }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      id: [this.objeto.id],
      // La empresa no se selecciona: siempre es la de la sesion actual
      // (LoginService.getIdEmpresaActual()), asignada al enviar el formulario.
      idEmpresa: [this.objeto.idEmpresa],
      codBanco: [this.objeto.codBanco],
      nomBanco: [this.objeto.nomBanco, Validators.required],
      nroCuenta: [this.objeto.nroCuenta, Validators.required],
      activo: [this.objeto.activo],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
      usuarios: this.fb.array([])
    });

    // No se usa formulario.disable(): los inputs de texto usan [readonly] en la
    // plantilla. El checkbox "activo" es la excepcion: HTML no tiene un
    // "readonly" real para el, asi que se deshabilita individualmente.
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.get('activo')?.disable();
    }

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? "DETALLE BANCO" : "ACTUALIZACION BANCO";
        this.ModoEdicion(Number(id));
      } else {
        this.isEditMode = false;
        this.objeto = new Banco();
        this.titulo_form = "REGISTRO DE BANCO";
        this.formulario.get('activo')?.patchValue(true);
        this.formulario.get('idEmpresa')?.patchValue(this.loginService.getIdEmpresaActual());
      }
    });
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
      this.notificacion.showError('Ese usuario ya esta asignado al banco.');
      return;
    }
    this.usuarios.push(this.crearUsuarioForm(usuario));
    this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];
  }

  eliminarUsuario(index: number): void {
    this.usuarios.removeAt(index);
    this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];
  }

  /**
  * Metodo para cargar la informacion del banco por el (id)
  */
  ModoEdicion(id: number): void {
    this.bancoService.getBancoById(id).subscribe(
      (data: Banco) => {
        this.objeto = data;
        this.formulario.get('id')?.patchValue(data.id);
        this.formulario.get('idEmpresa')?.patchValue(data.idEmpresa);
        this.formulario.get('codBanco')?.patchValue(data.codBanco);
        this.formulario.get('nomBanco')?.patchValue(data.nomBanco);
        this.formulario.get('nroCuenta')?.patchValue(data.nroCuenta);
        this.formulario.get('activo')?.patchValue(data.activo);
        this.cargarLogsExistentes(data.logs);

        this.usuarios.clear();
        (data.usuarios || []).forEach(u => this.usuarios.push(this.crearUsuarioForm({
          idUsuario: u.idUsuario,
          usuario: u.usuario.usuario,
          nombreCompleto: u.usuario.nombreCompleto
        })));
        this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];
      },
      error => {
        console.error('Error al cargar el banco:', error);
        this.router.navigate(['/bancos']);
      }
    );
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

  enviarFormulario() {
    this.formulario.patchValue({
      idEmpresa: this.loginService.getIdEmpresaActual(),
      activo: this.formulario.get('activo')?.value ?? false,
      fechaMod: new Date().toISOString(),
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
      this.bancoService.edit(jsonParaAPI, this.objeto.id!).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Banco editado con éxito!');
          this.router.navigate(['/bancos']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el banco.');
        }
      });
    } else {
      const { id, ...bodyJson } = jsonParaAPI;
      this.bancoService.save(bodyJson).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Banco creado con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el banco.');
        }
      });
    }
  }

  // Limpia el formulario para dejarlo listo para un nuevo registro.
  resetCampos(): void {
    this.objeto = new Banco();
    this.formDirective.resetForm();
    this.usuarios.clear();
    this.dataSourceUsuarios.data = [];
    this.formulario.get('activo')?.patchValue(true);
    this.formulario.get('idEmpresa')?.patchValue(this.loginService.getIdEmpresaActual());

    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
  }

  // Muestra en un dialogo el historial de auditoria del registro actual
  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - ${this.objeto.codBanco}`,
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

}
