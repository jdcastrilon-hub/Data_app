import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { BodegaCombo } from 'src/app/core/interfaces/Bodega/BodegaCombo';
import { Documentos_Combo } from 'src/app/core/interfaces/Comercial/Documentos_Combo';
import { SucursalCombo } from 'src/app/core/interfaces/Core/SucursalCombo';
import { ClienteSearch } from 'src/app/core/interfaces/Comercial/ClienteSearch';
import { UsuarioSearch } from 'src/app/core/interfaces/Core/UsuarioSearch';
import { Cajas } from 'src/app/core/models/Ventas/Cajas';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { CajasService } from 'src/app/core/services/Ventas/cajas.service';
import { SucursalServiceService } from 'src/app/core/services/General/sucursal-service.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';
import { ComboClienteComponent } from 'src/app/modules/resources/combo-cliente/combo-cliente.component';
import { ComboEstadostockComponent } from 'src/app/modules/resources/combo-estadostock/combo-estadostock.component';
import { ComboUsuarioComponent } from 'src/app/modules/resources/combo-usuario/combo-usuario.component';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-form-caja',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatCheckboxModule, ComboClienteComponent, ComboEstadostockComponent, ComboUsuarioComponent],
  templateUrl: './form-caja.component.html',
  styleUrl: './form-caja.component.scss'
})
export class FormCajaComponent {

  formulario!: FormGroup;
  objeto!: Cajas;
  titulo_form: string = 'REGISTRO DE CAJA';
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  //Seleccion para sucursales.
  list_sucursal: SucursalCombo[] = [];
  SelectSucursalControl = new FormControl<SucursalCombo | null>(null, Validators.required);

  //Bodegas (segun sucursal seleccionada)
  list_bodegas: BodegaCombo[] = [];
  SelectBodegasControl = new FormControl<BodegaCombo | null>(null, Validators.required);

  //Documentos (segun sucursal seleccionada)
  list_documentos: Documentos_Combo[] = [];
  SelectdocumentoControl = new FormControl<Documentos_Combo | null>(null, Validators.required);

  //Grilla de usuarios asignados
  dataSourceUsuarios = new MatTableDataSource<FormGroup>();
  columnasUsuarios: string[] = ['usuario', 'nombre', 'acciones'];

  // Bodega/estado/cliente solo aplican si la caja es POS
  cajaPosActivo: boolean = true;

  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private cajasService: CajasService,
    private sucursalService: SucursalServiceService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router) {
    this.objeto = new Cajas();
  }

  volver(): void {
    this.router.navigate(['/cajas']);
  }

  ngOnInit() {
    let cliente_filtro: ClienteSearch = {
      idCliente: 0,
      idPersona: 0,
      codTit: '',
      nombreCompleto: ''
    };

    this.formulario = this.fb.group({
      id: [this.objeto.id],
      idEmp: [this.objeto.idEmp],
      idSucursal: [this.objeto.idSucursal],
      codCaja: [this.objeto.codCaja, Validators.required],
      nomCaja: [this.objeto.nomCaja, Validators.required],
      cajaPos: [this.objeto.cajaPos ?? false],
      horasTurno: [this.objeto.horasTurno ?? null],
      status: [this.objeto.status ?? true],
      idCliente: [this.objeto.idCliente],
      idBodega: [this.objeto.idBodega],
      idEstado: [this.objeto.idEstado],
      documento: [this.objeto.documento],
      searchCliente: [cliente_filtro],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
      usuarios: this.fb.array([])
    });

    // La grilla de usuarios y los combos (combo-cliente, combo-estadostock) implementan
    // ControlValueAccessor.setDisabledState, asi que formulario.disable() se propaga
    // correctamente con un solo llamado (mismo patron que compradirecta/venta-directa).
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');

    //Subcribir los cambios al seleccionar la sucursal (aplica en modo Nuevo y Edicion)
    this.SelectSucursalControl.valueChanges.subscribe(objectoSucursal => {
      if (objectoSucursal) {
        this.list_bodegas = objectoSucursal.list_bodegas!;
        this.list_documentos = objectoSucursal.documentos!;

        if (this.isEditMode) {
          const bodegaExistente = this.list_bodegas.find(b => b.id === this.objeto.idBodega);
          if (bodegaExistente) {
            this.SelectBodegasControl.setValue(bodegaExistente);
          }
          const documentoExistente = this.list_documentos.find(d => d.documento === this.objeto.documento);
          if (documentoExistente) {
            this.SelectdocumentoControl.setValue(documentoExistente);
          }
        } else {
          const unicaBodega = this.list_bodegas[0];
          if (unicaBodega) {
            this.SelectBodegasControl.setValue(unicaBodega);
            this.formulario.patchValue({ idBodega: unicaBodega.id });
          }
          const primerDocum = this.list_documentos[0];
          if (primerDocum) {
            this.SelectdocumentoControl.setValue(primerDocum);
            this.formulario.patchValue({ documento: primerDocum.documento });
          }
        }
      } else {
        this.list_bodegas = [];
        this.list_documentos = [];
      }
    });

    this.SelectBodegasControl.valueChanges.subscribe(objBodega => {
      // Ignora el reintento de seleccion que dispara cargarSucursales() al recargar
      // una caja no-POS en edicion (ver aplicarLogicaCajaPos): idBodega debe seguir en 0.
      if (objBodega && this.cajaPosActivo) {
        this.formulario.patchValue({ idBodega: objBodega.id });
      }
    });

    this.SelectdocumentoControl.valueChanges.subscribe(objDocumento => {
      if (objDocumento) {
        this.formulario.patchValue({ documento: objDocumento.documento });
      }
    });

    //Bodega/estado/cliente solo aplican si la caja es POS
    this.formulario.get('cajaPos')?.valueChanges.subscribe((activo: boolean) => {
      this.aplicarLogicaCajaPos(activo);
    });
    this.aplicarLogicaCajaPos(this.formulario.get('cajaPos')?.value);

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE CAJA' : 'ACTUALIZACION CAJA';
        this.ModoEdicion(Number(id));
      } else {
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO DE CAJA';
        this.objeto = new Cajas();
        this.formulario.patchValue({ idEmp: this.loginService.getIdEmpresaActual() });
        this.cargarSucursales();
      }
    });
  }

  cargarSucursales(): void {
    this.sucursalService.sucursalesxBodegas().subscribe({
      next: (data) => {
        this.list_sucursal = data;

        if (this.isEditMode && this.objeto.idSucursal) {
          const sucursalSeleccionada = this.list_sucursal.find(s => s.id === this.objeto.idSucursal);
          if (sucursalSeleccionada) {
            this.SelectSucursalControl.setValue(sucursalSeleccionada);
          }
        } else if (!this.isEditMode && this.list_sucursal.length === 1) {
          this.SelectSucursalControl.setValue(this.list_sucursal[0]);
        }
      },
      error: (err) => {
        console.error('Error cargando sucursales', err);
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
        idCliente: 0,
        searchCliente: cliente
      });
    }
  }

  recibirEstado(estado: any) {
    this.formulario.patchValue({
      idEstado: estado.id
    });
  }

  // Bodega, estado y cliente solo son relevantes si la caja es POS: al desmarcar
  // "Caja POS" se bloquean y se limpian (idBodega/idEstado/idCliente vuelven a 0,
  // valor que ya se usa en este formulario como "sin seleccion" - ver onClienteChange).
  aplicarLogicaCajaPos(activo: boolean): void {
    this.cajaPosActivo = !!activo;

    if (this.isReadOnly) {
      return; // En modo vista formulario.disable() ya se encarga de todo.
    }

    if (this.cajaPosActivo) {
      this.SelectBodegasControl.enable();
      this.formulario.get('searchCliente')?.enable();
      this.formulario.get('horasTurno')?.enable();
    } else {
      this.SelectBodegasControl.disable();
      this.SelectBodegasControl.setValue(null);
      this.formulario.get('searchCliente')?.disable();
      this.formulario.get('horasTurno')?.disable();
      this.formulario.patchValue({
        idBodega: 0,
        idEstado: 0,
        idCliente: 0,
        searchCliente: null,
        horasTurno: null
      });
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

  // El combo-usuario del cabezal dispara esto al elegir una coincidencia: se agrega
  // la fila de inmediato a la grilla (el combo se limpia solo para la siguiente busqueda).
  onUsuarioSeleccionado(usuario: UsuarioSearch): void {
    if (!usuario) {
      return;
    }
    const yaExiste = this.usuarios.controls.some(c => c.value.idUsuario === usuario.idUsuario);
    if (yaExiste) {
      this.notificacion.showError('Ese usuario ya esta asignado a la caja.');
      return;
    }
    this.usuarios.push(this.crearUsuarioForm(usuario));
    this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];
  }

  eliminarUsuario(index: number): void {
    this.usuarios.removeAt(index);
    this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];
  }

  //Metodo para cargar la caja que viene para edicion/visualizacion
  ModoEdicion(id: number): void {
    this.cajasService.getCajaById(id).subscribe({
      next: (data: Cajas) => {
        this.objeto = data;

        this.cargarLogsExistentes(data.logs);

        this.formulario.patchValue({
          id: data.id,
          idEmp: data.idEmp,
          idSucursal: data.idSucursal,
          codCaja: data.codCaja,
          nomCaja: data.nomCaja,
          cajaPos: data.cajaPos,
          horasTurno: data.horasTurno,
          status: data.status,
          idCliente: data.idCliente,
          idBodega: data.idBodega,
          idEstado: data.idEstado,
          documento: data.documento
        });

        // Si la caja no es POS, cargar el cliente aqui pisaria el estado ya limpiado
        // por aplicarLogicaCajaPos() (disparado por el patchValue de cajaPos de arriba).
        if (data.cliente && data.cajaPos) {
          this.onClienteChange(data.cliente);
        }

        this.usuarios.clear();
        (data.usuarios || []).forEach(u => this.usuarios.push(this.crearUsuarioForm({
          idUsuario: u.idUsuario,
          usuario: u.usuario.usuario,
          nombreCompleto: u.usuario.nombreCompleto
        })));
        this.dataSourceUsuarios.data = this.usuarios.controls as FormGroup[];

        this.cargarSucursales();

        if (this.isReadOnly) {
          this.formulario.disable();
          this.SelectSucursalControl.disable();
          this.SelectBodegasControl.disable();
          this.SelectdocumentoControl.disable();
        }
      },
      error: (err) => {
        console.error('Error al cargar la caja:', err);
        this.router.navigate(['/cajas']);
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
        titulo: `Historial de Auditoría - ${this.objeto.codCaja}`,
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
      this.cajasService.edit(this.objeto.id!, jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Caja actualizada con éxito!');
          this.router.navigate(['/cajas']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar la caja.');
        }
      });
    } else {
      this.cajasService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Caja guardada con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar la caja.');
        }
      });
    }
  }

  resetCampos() {
    this.objeto = new Cajas();
    this.formDirective.resetForm();
    this.usuarios.clear();
    this.dataSourceUsuarios.data = [];
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    this.formulario.patchValue({ idEmp: this.loginService.getIdEmpresaActual() });
  }

}
