import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PersonaSearch } from '../../../../core/interfaces/Compras/PersonaSearch';
import { ClientesService } from '../../../../core/services/Ventas/clientes.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Clientes } from '../../../../core/models/Ventas/Clientes';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ComboPersonaComponent } from 'src/app/modules/resources/combo-persona/combo-persona.component';
import { PersonaComponent, PersonaResumen } from 'src/app/modules/Comercial/resources/persona/persona.component';
import { PersonaService } from 'src/app/core/services/Compras/persona.service';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';
import { LoginService } from 'src/app/core/services/core/login.service';

// Estados posibles del sub-formulario de persona dentro del cliente:
// - pendiente: aun no se decide si es una persona nueva o existente (bloqueado)
// - existente: se seleccionó una persona ya registrada (bloqueado, datos cargados)
// - nueva: se va a registrar una persona nueva (habilitado)
type EstadoPersona = 'pendiente' | 'existente' | 'nueva';

@Component({
  selector: 'app-form-cliente',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatAutocompleteModule, MatDatepickerModule,
    MatCheckboxModule, ComboPersonaComponent, PersonaComponent],
  templateUrl: './form-cliente.component.html',
  styleUrl: './form-cliente.component.scss'
})
export class FormClienteComponent {

  formulario!: FormGroup;
  objeto!: Clientes;
  titulo_form!: string;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  // Mientras no se busque/elija una persona, el sub-formulario de persona permanece bloqueado
  estadoPersona: EstadoPersona = 'pendiente';

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private clienteService: ClientesService,
    private personaService: PersonaService,
    private logAuditoria: AuditoriaService,
    private route: ActivatedRoute,
    private notificacion: NotificacionesService,
    private dialog: MatDialog,
    private loginService: LoginService,
    private router: Router) {
    this.objeto = new Clientes();
  }

  // Vuelve al listado. El filtro/pagina en el que se quedo la lista se restaura
  // desde ClienteListStateService.
  volver(): void {
    this.router.navigate(['/clientes']);
  }

  ngOnInit() {

    let persona_filtro: PersonaSearch = {
      idPersona: 0,
      codTit: '',
      nombreCompleto: ''
    }

    this.formulario = this.fb.group({
      idEmp: [this.objeto.idEmp],
      idCliente: [this.objeto.idCliente],
      idPersona: [0],
      persona: PersonaComponent.crearFormGroup(),
      codigoTitular: [this.objeto.codigoTitular, Validators.required],
      nomCliente: [this.objeto.nomCliente, Validators.required],
      direccion: [this.objeto.direccion, Validators.required],
      mail: [this.objeto.mail, Validators.required],
      activo: [this.objeto.activo],
      observacion: [this.objeto.observacion],
      searchPersona: [persona_filtro],
      fechaMod: this.objeto.fechaMod,
      logs: this.fb.array([]),
    });

    // No se usa formulario.disable(): los inputs usan [readonly] en la plantilla.
    // El checkbox es la excepción: HTML no tiene un "readonly" real, se deshabilita.
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.get('activo')?.disable();
    }

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE CLIENTE' : 'ACTUALIZACION CLIENTE';
        this.ModoEdicion(Number(id));

      } else {
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO CLIENTE';
        this.objeto = new Clientes();
        this.formulario.get('activo')?.patchValue(true);
      }
    });
  }

  /**
  * Metodo para cargar la informacion del cliente (y su persona asociada) por el (id)
  */
  ModoEdicion(id: number): void {
    this.clienteService.getClienteById(id).subscribe(
      (data: Clientes) => {
        this.objeto = data;

        this.formulario.patchValue({
          idEmp: data.idEmp,
          idCliente: data.idCliente,
          idPersona: data.idPersona,
          codigoTitular: data.codigoTitular,
          nomCliente: data.nomCliente,
          direccion: data.direccion,
          mail: data.mail,
          activo: data.activo,
          observacion: data.observacion,
        });

        // La persona ya esta ligada al cliente: queda bloqueada, igual que al
        // seleccionar una "existente" desde el buscador.
        this.estadoPersona = 'existente';
        this.formulario.get('searchPersona')?.patchValue({
          idPersona: data.idPersona,
          codTit: data.persona.codigoTitular,
          nombreCompleto: data.persona.nombreCompleto
        } as PersonaSearch);
        this.formulario.get('searchPersona')?.disable();
        this.personaGroup.patchValue({
          ...data.persona,
          fechaNacimiento: data.persona.fechaNacimiento ? new Date(data.persona.fechaNacimiento) : null,
        });

        this.cargarLogsExistentes(data.logs);
      },
      error => {
        console.error('Error al cargar el cliente:', error);
        this.router.navigate(['/clientes']);
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

  // Muestra en un dialogo el historial de auditoria del registro actual
  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - ${this.objeto.codigoTitular}`,
        logs: this.formulario.get('logs')?.value
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }

  get personaGroup(): FormGroup {
    return this.formulario.get('persona') as FormGroup;
  }

  get personaSubformDeshabilitado(): boolean {
    if (this.isReadOnly) {
      return true;
    }
    // No existe todavia un maestro de personas dedicado: al editar un cliente
    // tambien se permite corregir los datos propios de la persona ya ligada
    // (el buscador sigue bloqueado: no se puede reasignar a otra persona desde aqui).
    if (this.isEditMode) {
      return false;
    }
    return this.estadoPersona !== 'nueva';
  }

  // El buscador de personas (combo-persona) dispara esto al elegir/limpiar una coincidencia existente
  onPersonaChange(persona: PersonaSearch) {
    if (persona != null) {
      this.estadoPersona = 'existente';
      this.formulario.patchValue({
        idPersona: persona.idPersona,
        searchPersona: persona,
        codigoTitular: persona.codTit,
        nomCliente: persona.nombreCompleto
      });
      this.formulario.get('searchPersona')?.disable();

      // Cargamos el detalle completo para que el sub-formulario de persona lo muestre
      this.personaService.getById(persona.idPersona!).subscribe({
        next: (personaCompleta) => {
          this.personaGroup.patchValue({
            ...personaCompleta,
            fechaNacimiento: personaCompleta.fechaNacimiento ? new Date(personaCompleta.fechaNacimiento) : null,
          });
        },
        error: (err) => console.error('Error cargando el detalle de la persona', err)
      });
    } else {
      this.reiniciarSeleccionPersona();
    }
  }

  // El usuario indicó que quiere registrar una persona nueva (opción "Crear nueva persona" del buscador)
  habilitarNuevaPersona(textoBuscado?: string) {
    this.estadoPersona = 'nueva';
    this.formulario.get('searchPersona')?.disable();
    this.formulario.patchValue({
      idPersona: 0,
      codigoTitular: null,
      nomCliente: null
    });
    this.personaGroup.reset(PersonaComponent.crearFormGroup({ codigoTitular: textoBuscado }).getRawValue());
  }

  // Vuelve al estado inicial: ni persona existente ni nueva, todo bloqueado de nuevo
  reiniciarSeleccionPersona() {
    this.estadoPersona = 'pendiente';
    this.formulario.get('searchPersona')?.enable();
    this.formulario.patchValue({
      idPersona: 0,
      searchPersona: null,
      codigoTitular: null,
      nomCliente: null
    });
    this.personaGroup.reset(PersonaComponent.crearFormGroup().getRawValue());
  }

  // Mientras se registra una persona NUEVA, o se corrigen los datos de la persona
  // ligada durante una edicion, reflejamos su documento/nombre en los campos propios del cliente
  onPersonaSubformChange(resumen: PersonaResumen) {
    if (this.estadoPersona !== 'nueva' && !this.isEditMode) {
      return;
    }
    this.formulario.patchValue({
      codigoTitular: resumen.codigoTitular,
      nomCliente: resumen.nombreCompleto
    });
  }

  // Método para agregar el log al FormArray
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
    const estadoActivo = this.formulario.get('activo')?.value;

    this.formulario.patchValue({
      fechaMod: new Date().toISOString(),
      activo: !!estadoActivo,
      idEmp: this.loginService.getIdEmpresaActual()
    });

    if (this.estadoPersona === 'pendiente') {
      this.notificacion.showError('Debes buscar una persona existente o crear una nueva antes de guardar.');
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    //Auditoria
    this.agregarLogAuditoria();

    const dataCompleta = this.formulario.getRawValue();
    // El detalle de persona solo se envia cuando el sub-formulario estuvo habilitado
    // (persona nueva al crear, o cualquier edicion de cliente, donde tambien se
    // permite corregir los datos de la persona ya ligada). Si se eligio una persona
    // existente durante la creacion, el backend no necesita (ni usa) ese detalle.
    const personaEditable = this.isEditMode || this.estadoPersona === 'nueva';
    const jsonParaAPI = {
      ...dataCompleta,
      searchPersona: undefined,
      persona: personaEditable
        ? PersonaComponent.aPayload(dataCompleta.persona)
        : undefined,
    };

    if (this.isEditMode) {
      this.clienteService.edit(jsonParaAPI, this.objeto.idCliente!).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Cliente editado con éxito!');
          this.router.navigate(['/clientes']);
        },
        error: (err) => {
          console.error('Error al editar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el cliente.');
        }
      });
    } else {
      this.clienteService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Cliente guardado con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el cliente.');
        }
      });
    }
  }

  resetCampos() {
    this.objeto = new Clientes();
    this.formDirective.resetForm();
    this.estadoPersona = 'pendiente';
    this.personaGroup.reset(PersonaComponent.crearFormGroup().getRawValue());
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    this.formulario.patchValue({ activo: true });
  }

}
