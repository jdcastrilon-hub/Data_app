import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PersonaSearch } from '../../../../core/interfaces/Compras/PersonaSearch';
import { ProveedorService } from '../../../../core/services/Compras/proveedor.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Proveedores } from '../../../../core/models/Compras/Proveedores';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ComboPersonaComponent } from 'src/app/modules/resources/combo-persona/combo-persona.component';
import { PersonaComponent, PersonaResumen } from 'src/app/modules/Comercial/resources/persona/persona.component';
import { PersonaService } from 'src/app/core/services/Compras/persona.service';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

// Estados posibles del sub-formulario de persona dentro del proveedor:
// - pendiente: aun no se decide si es una persona nueva o existente (bloqueado)
// - existente: se seleccionó una persona ya registrada (bloqueado, datos cargados)
// - nueva: se va a registrar una persona nueva (habilitado)
type EstadoPersona = 'pendiente' | 'existente' | 'nueva';

@Component({
  selector: 'app-form-proveedor',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatAutocompleteModule, MatDatepickerModule,
    MatCheckboxModule, ComboPersonaComponent, PersonaComponent],
  templateUrl: './form-proveedor.component.html',
  styleUrl: './form-proveedor.component.scss'
})
export class FormProveedorComponent {

  formulario!: FormGroup;
  objeto!: Proveedores;
  titulo_form!: string;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  // Mientras no se busque/elija una persona, el sub-formulario de persona permanece bloqueado
  estadoPersona: EstadoPersona = 'pendiente';

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private proveedorService: ProveedorService,
    private personaService: PersonaService,
    private logAuditoria: AuditoriaService,
    private route: ActivatedRoute,
    private notificacion: NotificacionesService,
    private dialog: MatDialog,
    private router: Router) {
    this.objeto = new Proveedores();
  }

  // Vuelve al listado. El filtro/pagina en el que se quedo la lista se restaura
  // desde ProveedorListStateService.
  volver(): void {
    this.router.navigate(['/proveedores']);
  }

  ngOnInit() {

    let persona_filtro: PersonaSearch = {
      idPersona: 0,
      codTit: '',
      nombreCompleto: ''
    }

    this.formulario = this.fb.group({
      idEmp: [this.objeto.idEmp],
      idProveedor: [this.objeto.idProveedor],
      idPersona: [0],
      persona: PersonaComponent.crearFormGroup(),
      codigoTitular: [this.objeto.codigoTitular, Validators.required],
      razonSocial: [this.objeto.razonSocial, Validators.required],
      regimen: [this.objeto.regimen, Validators.required],
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
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE PROVEEDOR' : 'ACTUALIZACION PROVEEDOR';
        this.ModoEdicion(Number(id));

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO PROVEEDOR';
        this.objeto = new Proveedores();
        this.formulario.get('activo')?.patchValue(false);
      }
    });
  }

  /**
  * Metodo para cargar la informacion del proveedor (y su persona asociada) por el (id)
  */
  ModoEdicion(id: number): void {
    this.proveedorService.getProveedorById(id).subscribe(
      (data: Proveedores) => {
        this.objeto = data;

        this.formulario.patchValue({
          idEmp: data.idEmp,
          idProveedor: data.idProveedor,
          idPersona: data.idPersona,
          codigoTitular: data.codigoTitular,
          razonSocial: data.razonSocial,
          regimen: data.regimen,
          activo: data.activo,
          observacion: data.observacion,
        });

        // La persona ya esta ligada al proveedor: queda bloqueada, igual que al
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
        console.error('Error al cargar el proveedor:', error);
        this.router.navigate(['/proveedores']);
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

    // Material devuelve el foco al boton que abrio el dialogo al cerrarlo (accesibilidad),
    // lo que deja el icono con el resaltado de "enfocado" pegado visualmente.
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
    // No existe todavia un maestro de personas dedicado: al editar un proveedor
    // tambien se permite corregir los datos propios de la persona ya ligada
    // (el buscador sigue bloqueado: no se puede reasignar a otra persona desde aqui).
    if (this.isEditMode) {
      return false;
    }
    return this.estadoPersona !== 'nueva';
  }

  // El buscador de personas (combo-persona) dispara esto al elegir/limpiar una coincidencia existente
  onPersonaChange(persona: PersonaSearch) {
    console.log('onPersonaChange:', persona);
    if (persona != null) {
      this.estadoPersona = 'existente';
      this.formulario.patchValue({
        idPersona: persona.idPersona,
        searchPersona: persona,
        codigoTitular: persona.codTit,
        razonSocial: persona.nombreCompleto
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
      razonSocial: null
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
      razonSocial: null
    });
    this.personaGroup.reset(PersonaComponent.crearFormGroup().getRawValue());
  }

  // Mientras se registra una persona NUEVA, o se corrigen los datos de la persona
  // ligada durante una edicion, reflejamos su documento/nombre en los campos propios del proveedor
  onPersonaSubformChange(resumen: PersonaResumen) {
    if (this.estadoPersona !== 'nueva' && !this.isEditMode) {
      return;
    }
    this.formulario.patchValue({
      codigoTitular: resumen.codigoTitular,
      razonSocial: resumen.nombreCompleto
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
    console.log("enviarFormulario");
    const estadoActivo = this.formulario.get('activo')?.value;

    this.formulario.patchValue({
      fechaMod: new Date().toISOString(),
      activo: !!estadoActivo,
      idEmp: 1
    });

    if (this.estadoPersona === 'pendiente') {
      this.notificacion.showError('Debes buscar una persona existente o crear una nueva antes de guardar.');
      return;
    }

    console.log(this.formulario.getRawValue());
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Auditoria
    this.agregarLogAuditoria();

    const dataCompleta = this.formulario.getRawValue();
    // El detalle de persona solo se envia cuando el sub-formulario estuvo habilitado
    // (persona nueva al crear, o cualquier edicion de proveedor, donde tambien se
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
      //Evento Edicion
      this.proveedorService.edit(jsonParaAPI, this.objeto.idProveedor!).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Proveedor editado con éxito!');
          this.router.navigate(['/proveedores']);
        },
        error: (err) => {
          console.error('Error al editar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el proveedor.');
        }
      });
    } else {
      //Evento nuevo
      this.proveedorService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Proveedor guardado con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el proveedor.');
        }
      });
    }
  }

  resetCampos() {
    //Limpiar el formulario
    this.objeto = new Proveedores();
    this.formDirective.resetForm();
    this.estadoPersona = 'pendiente';
    this.personaGroup.reset(PersonaComponent.crearFormGroup().getRawValue());
    //reset grilla de logs
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
  }

}
