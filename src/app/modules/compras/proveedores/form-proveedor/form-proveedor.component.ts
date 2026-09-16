import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PersonaSearch } from '../../../../core/interfaces/Compras/PersonaSearch';
import { ProveedorService } from '../../../../core/services/Compras/proveedor.service';
import { Proveedores } from '../../../../core/models/Compras/Proveedores';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { PersonaComponent, PersonaResumen } from 'src/app/modules/Comercial/resources/persona/persona.component';
import { PersonaService } from 'src/app/core/services/Compras/persona.service';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';
import { ModalSeleccionarPersonaComponent } from 'src/app/modules/resources/modal-seleccionar-persona/modal-seleccionar-persona.component';
import { LoginService } from 'src/app/core/services/core/login.service';

// Estados posibles del sub-formulario de persona dentro del proveedor:
// - nueva: por defecto - el campo Numero/resto de datos estan abiertos, se
//   entiende que se esta registrando una persona nueva mientras no se
//   demuestre lo contrario (buscador, o coincidencia exacta al perder el foco).
// - existente: se encontro/eligio una persona ya registrada (bloqueado, datos
//   cargados) - "Cambiar persona" vuelve a "nueva".
type EstadoPersona = 'existente' | 'nueva';

@Component({
  selector: 'app-form-proveedor',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatCheckboxModule, PersonaComponent],
  templateUrl: './form-proveedor.component.html',
  styleUrl: './form-proveedor.component.scss'
})
export class FormProveedorComponent {

  formulario!: FormGroup;
  objeto!: Proveedores;
  titulo_form!: string;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  // Por defecto "nueva": el formulario no bloquea nada mientras se decide -
  // ver EstadoPersona.
  estadoPersona: EstadoPersona = 'nueva';

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private proveedorService: ProveedorService,
    private personaService: PersonaService,
    private logAuditoria: AuditoriaService,
    private route: ActivatedRoute,
    private notificacion: NotificacionesService,
    private dialog: MatDialog,
    private loginService: LoginService,
    private router: Router) {
    this.objeto = new Proveedores();
  }

  // Vuelve al listado. El filtro/pagina en el que se quedo la lista se restaura
  // desde ProveedorListStateService.
  volver(): void {
    this.router.navigate(['/proveedores']);
  }

  ngOnInit() {

    this.formulario = this.fb.group({
      idEmp: [this.objeto.idEmp],
      idProveedor: [this.objeto.idProveedor],
      idPersona: [0],
      persona: PersonaComponent.crearFormGroup(),
      codigoTitular: [this.objeto.codigoTitular, Validators.required],
      razonSocial: [this.objeto.razonSocial, Validators.required],
      regimen: [this.objeto.regimen, Validators.required],
      responsableIva: [this.objeto.responsableIva ?? false],
      activo: [this.objeto.activo],
      observacion: [this.objeto.observacion],
      fechaMod: this.objeto.fechaMod,
      logs: this.fb.array([]),
    });

    // No se usa formulario.disable(): los inputs usan [readonly] en la plantilla.
    // El checkbox y el select no tienen un "readonly" real, se deshabilitan.
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.get('activo')?.disable();
      this.formulario.get('responsableIva')?.disable();
      this.formulario.get('regimen')?.disable();
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
          responsableIva: data.responsableIva,
          activo: data.activo,
          observacion: data.observacion,
        });

        // La persona ya esta ligada al proveedor: queda bloqueada, igual que al
        // elegir una "existente" desde el modal de busqueda.
        this.estadoPersona = 'existente';
        this.personaGroup.patchValue(data.persona);

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
    // (no se puede reasignar a otra persona desde aqui).
    if (this.isEditMode) {
      return false;
    }
    return this.estadoPersona !== 'nueva';
  }

  // El boton "Buscar persona" (junto a Numero) abre el modal de seleccion.
  abrirModalPersona(): void {
    const dialogRef = this.dialog.open(ModalSeleccionarPersonaComponent, {
      width: '700px'
    });

    dialogRef.afterClosed().subscribe((persona: PersonaSearch | undefined) => {
      // Sin seleccion (se cerro el modal sin elegir nada) -> se entiende que
      // sigue siendo una persona nueva, no hay nada que hacer.
      if (persona) {
        this.onPersonaEncontrada(persona);
      }
    });
  }

  // Se encontro/eligio una persona ya existente - sea desde el modal de
  // busqueda, o porque coincidio el documento al perder el foco de "Numero".
  onPersonaEncontrada(persona: PersonaSearch): void {
    this.estadoPersona = 'existente';
    this.formulario.patchValue({
      idPersona: persona.idPersona,
      codigoTitular: persona.codTit,
      razonSocial: persona.nombreCompleto
    });

    // Cargamos el detalle completo para que el sub-formulario de persona lo muestre
    this.personaService.getById(persona.idPersona!).subscribe({
      next: (personaCompleta) => {
        this.personaGroup.patchValue(personaCompleta);
      },
      error: (err) => console.error('Error cargando el detalle de la persona', err)
    });
  }

  // El usuario quiere deshacer la persona vinculada (se equivoco al elegirla,
  // o simplemente cambio de opinion) - vuelve al estado inicial, abierto.
  cambiarPersona(): void {
    this.estadoPersona = 'nueva';
    this.formulario.patchValue({
      idPersona: 0,
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
      idEmp: this.loginService.getIdEmpresaActual()
    });

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
    this.estadoPersona = 'nueva';
    this.personaGroup.reset(PersonaComponent.crearFormGroup().getRawValue());
    //reset grilla de logs
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
  }

}
