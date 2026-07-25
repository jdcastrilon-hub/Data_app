import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UsuarioSearch } from 'src/app/core/interfaces/Core/UsuarioSearch';
import { CiudadCombo } from 'src/app/core/interfaces/Core/CiudadCombo';
import { SucursalAdmin } from 'src/app/core/models/core/SucursalAdmin';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { SucursalServiceService } from 'src/app/core/services/General/sucursal-service.service';
import { CiudadesService } from 'src/app/core/services/core/ciudades.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { ComboUsuarioComponent } from 'src/app/modules/resources/combo-usuario/combo-usuario.component';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'app-form-sucursal',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatCheckboxModule, ComboUsuarioComponent],
  templateUrl: './form-sucursal.component.html',
  styleUrl: './form-sucursal.component.scss'
})
export class FormSucursalComponent {

  formulario!: FormGroup;
  objeto!: SucursalAdmin;
  titulo_form!: string;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  //Ciudad
  list_ciudades: CiudadCombo[] = [];
  SelecCiudadControl = new FormControl<CiudadCombo | null>(null, Validators.required);

  //Grilla de usuarios asignados (segundo bloque del mismo tab, tabla pequeña)
  dataSourceUsuarios = new MatTableDataSource<FormGroup>();
  columnasUsuarios: string[] = ['usuario', 'nombre', 'acciones'];

  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private sucursalService: SucursalServiceService,
    private ciudadService: CiudadesService,
    private logAuditoria: AuditoriaService,
    private route: ActivatedRoute,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private dialog: MatDialog,
    private router: Router) {
    this.objeto = new SucursalAdmin();
  }

  volver(): void {
    this.router.navigate(['/administracion']);
  }

  ngOnInit() {
    this.formulario = this.fb.group({
      id: [this.objeto.id],
      idEmpresa: [this.objeto.idEmpresa],
      codSucursal: [this.objeto.codSucursal, Validators.required],
      nomSucursal: [this.objeto.nomSucursal, Validators.required],
      idCiudad: [this.objeto.idCiudad, Validators.required],
      direccion: [this.objeto.direccion],
      telefono: [this.objeto.telefono],
      activo: [this.objeto.activo],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
      usuarios: this.fb.array([])
    });

    this.CargaCiudades();
    this.SelecCiudadControl.valueChanges.subscribe(ciudad => {
      this.formulario.get('idCiudad')?.setValue(ciudad?.idCiudad ?? null);
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.SelecCiudadControl.disable();
    }

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE SUCURSAL' : 'ACTUALIZACION SUCURSAL';
        this.ModoEdicion(Number(id));
      } else {
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO SUCURSAL';
        this.objeto = new SucursalAdmin();
        this.formulario.patchValue({
          idEmpresa: this.loginService.getIdEmpresaActual(),
          activo: true
        });
      }
    });
  }

  CargaCiudades(): void {
    this.ciudadService.listSelection().subscribe({
      next: (data) => {
        this.list_ciudades = data;
        const idActual = this.formulario.get('idCiudad')?.value;
        const seleccionada = this.list_ciudades.find(c => c.idCiudad === idActual);
        if (seleccionada) {
          this.SelecCiudadControl.setValue(seleccionada, { emitEvent: false });
        }
      },
      error: (err) => console.error('Error cargando ciudades', err)
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
      this.notificacion.showError('Ese usuario ya esta asignado a la sucursal.');
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
    this.sucursalService.getSucursalById(id).subscribe({
      next: (data: SucursalAdmin) => {
        this.objeto = data;

        this.formulario.patchValue({
          id: data.id,
          idEmpresa: data.idEmpresa,
          codSucursal: data.codSucursal,
          nomSucursal: data.nomSucursal,
          idCiudad: data.idCiudad,
          direccion: data.direccion,
          telefono: data.telefono,
          activo: data.activo,
        });

        const seleccionada = this.list_ciudades.find(c => c.idCiudad === data.idCiudad);
        if (seleccionada) {
          this.SelecCiudadControl.setValue(seleccionada, { emitEvent: false });
        }

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
        console.error('Error al cargar la sucursal:', err);
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
        titulo: `Historial de Auditoría - ${this.objeto.codSucursal}`,
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
      this.sucursalService.edit(this.objeto.id!, jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Sucursal editada con éxito!');
          this.router.navigate(['/administracion']);
        },
        error: (err) => {
          console.error('Error al editar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar la sucursal.');
        }
      });
    } else {
      this.sucursalService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Sucursal guardada con éxito!');
          this.router.navigate(['/administracion']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar la sucursal.');
        }
      });
    }
  }

}
