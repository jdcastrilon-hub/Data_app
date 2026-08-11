import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UsuarioSearch } from 'src/app/core/interfaces/Core/UsuarioSearch';
import { Rol } from 'src/app/core/models/core/Rol';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { RolService } from 'src/app/core/services/core/rol.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { ComboUsuarioComponent } from 'src/app/modules/resources/combo-usuario/combo-usuario.component';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'app-form-rol',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatCheckboxModule, ComboUsuarioComponent],
  templateUrl: './form-rol.component.html',
  styleUrl: './form-rol.component.scss'
})
export class FormRolComponent {

  formulario!: FormGroup;
  objeto!: Rol;
  titulo_form!: string;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  //Grilla de usuarios asignados (segundo bloque del mismo tab, tabla pequeña)
  dataSourceUsuarios = new MatTableDataSource<FormGroup>();
  columnasUsuarios: string[] = ['usuario', 'nombre', 'acciones'];

  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private rolService: RolService,
    private logAuditoria: AuditoriaService,
    private route: ActivatedRoute,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private dialog: MatDialog,
    private router: Router) {
    this.objeto = new Rol();
  }

  volver(): void {
    this.router.navigate(['/administracion']);
  }

  ngOnInit() {
    this.formulario = this.fb.group({
      idRol: [this.objeto.idRol],
      idEmp: [this.objeto.idEmp],
      codigo: [this.objeto.codigo, Validators.required],
      nombre: [this.objeto.nombre, Validators.required],
      // Descripcion no se muestra en el formulario (a pedido del usuario, el nombre
      // corto ya es suficiente) pero se conserva en la BD - siempre se graba vacia.
      descripcion: [null],
      activo: [this.objeto.activo],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
      usuarios: this.fb.array([])
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE ROL' : 'ACTUALIZACION ROL';
        this.ModoEdicion(Number(id));
      } else {
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO ROL';
        this.objeto = new Rol();
        this.formulario.patchValue({
          idEmp: this.loginService.getIdEmpresaActual(),
          activo: true
        });
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
      this.notificacion.showError('Ese usuario ya esta asignado al rol.');
      return;
    }
    this.usuarios.push(this.crearUsuarioForm(usuario));
    this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];
  }

  eliminarUsuario(index: number): void {
    this.usuarios.removeAt(index);
    this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];
  }

  ModoEdicion(id: number): void {
    this.rolService.getRolById(id).subscribe({
      next: (data: Rol) => {
        this.objeto = data;

        this.formulario.patchValue({
          idRol: data.idRol,
          idEmp: data.idEmp,
          codigo: data.codigo,
          nombre: data.nombre,
          activo: data.activo,
        });

        this.usuarios.clear();
        (data.usuarios || []).forEach(u => this.usuarios.push(this.crearUsuarioForm({
          idUsuario: u.idUsuario,
          usuario: u.usuario.usuario,
          nombreCompleto: u.usuario.nombreCompleto
        })));
        this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];

        this.cargarLogsExistentes(data.logs);

        if (this.isReadOnly) {
          this.formulario.disable();
        }
      },
      error: (err) => {
        console.error('Error al cargar el rol:', err);
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
        titulo: `Historial de Auditoría - ${this.objeto.codigo}`,
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
      this.rolService.edit(this.objeto.idRol!, jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Rol editado con éxito!');
          this.router.navigate(['/administracion']);
        },
        error: (err) => {
          console.error('Error al editar:', err);
          this.notificacion.showError(err.error?.detail || err.error?.message || 'No se pudo editar el rol.');
        }
      });
    } else {
      this.rolService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Rol guardado con éxito!');
          this.router.navigate(['/administracion']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.detail || err.error?.message || 'No se pudo guardar el rol.');
        }
      });
    }
  }

}
