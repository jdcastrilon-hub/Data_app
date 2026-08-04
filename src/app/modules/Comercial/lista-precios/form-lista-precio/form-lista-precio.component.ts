import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { ClienteSearch } from 'src/app/core/interfaces/Comercial/ClienteSearch';
import { UsuarioSearch } from 'src/app/core/interfaces/Core/UsuarioSearch';
import { ListaPrecio } from 'src/app/core/models/Ventas/ListaPrecio';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { ListaprecioService } from 'src/app/core/services/Ventas/listaprecio.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';
import { ComboClienteComponent } from 'src/app/modules/resources/combo-cliente/combo-cliente.component';
import { ComboUsuarioComponent } from 'src/app/modules/resources/combo-usuario/combo-usuario.component';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-form-lista-precio',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatCheckboxModule, ComboClienteComponent, ComboUsuarioComponent],
  templateUrl: './form-lista-precio.component.html',
  styleUrl: './form-lista-precio.component.scss'
})
export class FormListaPrecioComponent {

  formulario!: FormGroup;
  objeto!: ListaPrecio;
  titulo_form: string = 'REGISTRO DE LISTA DE PRECIOS';
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  //Grilla de usuarios asignados
  dataSourceUsuarios = new MatTableDataSource<FormGroup>();
  columnasUsuarios: string[] = ['usuario', 'nombre', 'acciones'];

  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private listaprecioService: ListaprecioService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router) {
    this.objeto = new ListaPrecio();
  }

  volver(): void {
    this.router.navigate(['/listaprecios']);
  }

  // La tabla de usuarios asignados (m_listaprecioxuser) solo tiene sentido para
  // una lista base sin dueno: si es general aplica a todos sin excepcion, y si
  // es de un cliente puntual el acceso es inherente a servir a ese cliente, no
  // una decision de confianza por-empleado. Ver project_data_lista_precios_design.
  get usuariosTabBloqueado(): boolean {
    return !!this.formulario?.get('esGeneral')?.value || !!this.formulario?.get('idCliente')?.value;
  }

  get usuariosTabMensaje(): string {
    if (this.formulario?.get('esGeneral')?.value) {
      return 'Esta lista es general: aplica automáticamente a todos los usuarios, no requiere asignación.';
    }
    if (this.formulario?.get('idCliente')?.value) {
      return 'Esta lista es de un cliente específico: el acceso lo da atender a ese cliente, no una asignación por usuario.';
    }
    return '';
  }

  ngOnInit() {
    let cliente_filtro: ClienteSearch = {
      idCliente: 0,
      idPersona: 0,
      codTit: '',
      nombreCompleto: ''
    };

    this.formulario = this.fb.group({
      idLista: [this.objeto.idLista],
      idEmp: [this.objeto.idEmp],
      nombre: [this.objeto.nombre, Validators.required],
      idCliente: [this.objeto.idCliente ?? null],
      esGeneral: [this.objeto.esGeneral ?? false],
      activo: [this.objeto.activo ?? true],
      searchCliente: [cliente_filtro],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
      usuarios: this.fb.array([])
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');

    // Una lista general no puede a la vez tener cliente ni usuarios asignados
    // (aplica para todos por definicion) - se bloquean y limpian ambos campos.
    this.formulario.get('esGeneral')?.valueChanges.subscribe((activo: boolean) => {
      this.aplicarLogicaEsGeneral(activo);
    });
    this.aplicarLogicaEsGeneral(this.formulario.get('esGeneral')?.value);

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE LISTA DE PRECIOS' : 'ACTUALIZACION LISTA DE PRECIOS';
        this.ModoEdicion(Number(id));
      } else {
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO DE LISTA DE PRECIOS';
        this.objeto = new ListaPrecio();
        this.formulario.patchValue({ idEmp: this.loginService.getIdEmpresaActual() });
      }
    });
  }

  onClienteChange(cliente: ClienteSearch) {
    if (cliente != null) {
      this.formulario.patchValue({
        idCliente: cliente.idCliente,
        searchCliente: cliente
      });
      this.formulario.get('searchCliente')?.disable();
    } else {
      this.formulario.get('searchCliente')?.enable();
      this.formulario.patchValue({
        idCliente: null,
        searchCliente: cliente
      });
    }
  }

  aplicarLogicaEsGeneral(esGeneral: boolean): void {
    if (this.isReadOnly) {
      return; // En modo vista formulario.disable() ya se encarga de todo.
    }

    if (esGeneral) {
      this.formulario.get('searchCliente')?.disable();
      this.formulario.patchValue({
        idCliente: null,
        searchCliente: null
      });
      this.usuarios.clear();
      this.dataSourceUsuarios.data = [];
    } else {
      this.formulario.get('searchCliente')?.enable();
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
      this.notificacion.showError('Ese usuario ya esta asignado a la lista.');
      return;
    }
    this.usuarios.push(this.crearUsuarioForm(usuario));
    this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];
  }

  eliminarUsuario(index: number): void {
    this.usuarios.removeAt(index);
    this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];
  }

  //Metodo para cargar la lista que viene para edicion/visualizacion
  ModoEdicion(id: number): void {
    this.listaprecioService.getListaPrecioById(id).subscribe({
      next: (data: ListaPrecio) => {
        this.objeto = data;

        this.cargarLogsExistentes(data.logs);

        this.formulario.patchValue({
          idLista: data.idLista,
          idEmp: data.idEmp,
          nombre: data.nombre,
          idCliente: data.idCliente,
          esGeneral: data.esGeneral,
          activo: data.activo
        });

        // Si la lista es general, el cliente ya quedo limpiado por aplicarLogicaEsGeneral()
        // (disparado por el patchValue de esGeneral de arriba).
        if (data.cliente && !data.esGeneral) {
          this.onClienteChange(data.cliente);
        }

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
        console.error('Error al cargar la lista de precios:', err);
        this.router.navigate(['/listaprecios']);
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
        titulo: `Historial de Auditoría - ${this.objeto.nombre}`,
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
      searchCliente: undefined,
      usuarios: (dataCompleta.usuarios as { idUsuario: number }[]).map(u => ({ idUsuario: u.idUsuario }))
    };

    if (this.isEditMode) {
      this.listaprecioService.edit(this.objeto.idLista!, jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Lista de precios actualizada con éxito!');
          this.router.navigate(['/listaprecios']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar la lista de precios.');
        }
      });
    } else {
      this.listaprecioService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Lista de precios guardada con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar la lista de precios.');
        }
      });
    }
  }

  resetCampos() {
    this.objeto = new ListaPrecio();
    this.formDirective.resetForm();
    this.usuarios.clear();
    this.dataSourceUsuarios.data = [];
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    this.formulario.patchValue({ idEmp: this.loginService.getIdEmpresaActual(), activo: true });
  }

}
