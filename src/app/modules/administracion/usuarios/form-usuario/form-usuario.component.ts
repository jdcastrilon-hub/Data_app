import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PersonaSearch } from 'src/app/core/interfaces/Compras/PersonaSearch';
import { UsuariosService } from 'src/app/core/services/core/usuarios.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Usuario } from 'src/app/core/models/core/Usuario';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { ComboPersonaComponent } from 'src/app/modules/resources/combo-persona/combo-persona.component';
import { PersonaComponent, PersonaResumen } from 'src/app/modules/Comercial/resources/persona/persona.component';
import { PersonaService } from 'src/app/core/services/Compras/persona.service';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

// Estados posibles del sub-formulario de persona dentro del usuario (mismo patron que proveedores):
// - pendiente: aun no se decide si es una persona nueva o existente (bloqueado)
// - existente: se seleccionó una persona ya registrada (bloqueado, datos cargados)
// - nueva: se va a registrar una persona nueva (habilitado)
type EstadoPersona = 'pendiente' | 'existente' | 'nueva';

@Component({
  selector: 'app-form-usuario',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatAutocompleteModule, MatDatepickerModule,
    MatCheckboxModule, ComboPersonaComponent, PersonaComponent],
  templateUrl: './form-usuario.component.html',
  styleUrl: './form-usuario.component.scss'
})
export class FormUsuarioComponent {

  formulario!: FormGroup;
  objeto!: Usuario;
  titulo_form!: string;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  // Mientras no se busque/elija una persona, el sub-formulario de persona permanece bloqueado
  estadoPersona: EstadoPersona = 'pendiente';

  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private usuarioService: UsuariosService,
    private personaService: PersonaService,
    private logAuditoria: AuditoriaService,
    private route: ActivatedRoute,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private dialog: MatDialog,
    private router: Router) {
    this.objeto = new Usuario();
  }

  // Vuelve al modulo de Administracion (tab Usuarios). El filtro/pagina en el que se
  // quedo la lista se restaura desde UsuarioListStateService.
  volver(): void {
    this.router.navigate(['/administracion']);
  }

  ngOnInit() {

    let persona_filtro: PersonaSearch = {
      idPersona: 0,
      codTit: '',
      nombreCompleto: ''
    }

    this.formulario = this.fb.group({
      idEmp: [this.objeto.idEmp],
      idUsuario: [this.objeto.idUsuario],
      idPersona: [0],
      persona: PersonaComponent.crearFormGroup(),
      usuario: [this.objeto.usuario, Validators.required],
      clave: [''],
      nomUsuario: [this.objeto.nomUsuario, Validators.required],
      activo: [this.objeto.activo],
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
        this.titulo_form = this.isReadOnly ? 'DETALLE USUARIO' : 'ACTUALIZACION USUARIO';
        // En edicion la clave es opcional: en blanco significa "no cambiarla".
        this.formulario.get('clave')?.clearValidators();
        this.formulario.get('clave')?.updateValueAndValidity();
        this.ModoEdicion(Number(id));

      } else {
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO USUARIO';
        this.objeto = new Usuario();
        this.formulario.get('activo')?.patchValue(true);
        this.formulario.get('clave')?.setValidators(Validators.required);
        this.formulario.get('clave')?.updateValueAndValidity();
      }
    });
  }

  /**
  * Metodo para cargar la informacion del usuario (y su persona asociada) por el (id)
  */
  ModoEdicion(id: number): void {
    this.usuarioService.getUsuarioById(id, this.loginService.getIdEmpresaActual()!).subscribe(
      (data: Usuario) => {
        this.objeto = data;

        this.formulario.patchValue({
          idUsuario: data.idUsuario,
          idPersona: data.idPersona,
          usuario: data.usuario,
          nomUsuario: data.nomUsuario,
          activo: data.activo,
        });

        // La persona ya esta ligada al usuario: queda bloqueada, igual que al
        // seleccionar una "existente" desde el buscador.
        this.estadoPersona = 'existente';
        this.formulario.get('searchPersona')?.patchValue({
          idPersona: data.idPersona,
          codTit: data.persona.codigoTitular,
          nombreCompleto: data.persona.nombreCompleto
        } as PersonaSearch);
        this.formulario.get('searchPersona')?.disable();
        // emitEvent:false: esto es una carga inicial, no una edicion real del
        // usuario sobre los campos de la persona - sin esto, el patchValue de
        // nombres/apellidos dispara PersonaComponent.actualizarResumen() ->
        // onPersonaSubformChange(), que pisa el nomUsuario recien cargado
        // (linea de arriba) con el nombre completo de la persona.
        this.personaGroup.patchValue({
          ...data.persona,
          fechaNacimiento: data.persona.fechaNacimiento ? new Date(data.persona.fechaNacimiento) : null,
        }, { emitEvent: false });

        this.cargarLogsExistentes(data.logs);
      },
      error => {
        console.error('Error al cargar el usuario:', error);
        this.router.navigate(['/administracion']);
      }
    );
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
        titulo: `Historial de Auditoría - ${this.objeto.usuario}`,
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
    // No existe todavia un maestro de personas dedicado: al editar un usuario
    // tambien se permite corregir los datos propios de la persona ya ligada
    // (el buscador sigue bloqueado: no se puede reasignar a otra persona desde aqui).
    if (this.isEditMode) {
      return false;
    }
    return this.estadoPersona !== 'nueva';
  }

  onPersonaChange(persona: PersonaSearch) {
    if (persona != null) {
      this.estadoPersona = 'existente';
      this.formulario.patchValue({
        idPersona: persona.idPersona,
        searchPersona: persona,
      });
      this.formulario.get('searchPersona')?.disable();

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

  habilitarNuevaPersona(textoBuscado?: string) {
    this.estadoPersona = 'nueva';
    this.formulario.get('searchPersona')?.disable();
    this.formulario.patchValue({
      idPersona: 0,
    });
    this.personaGroup.reset(PersonaComponent.crearFormGroup({ codigoTitular: textoBuscado }).getRawValue());
  }

  reiniciarSeleccionPersona() {
    this.estadoPersona = 'pendiente';
    this.formulario.get('searchPersona')?.enable();
    this.formulario.patchValue({
      idPersona: 0,
      searchPersona: null,
    });
    this.personaGroup.reset(PersonaComponent.crearFormGroup().getRawValue());
  }

  // Mientras se registra una persona NUEVA, o se corrigen los datos de la persona
  // ligada durante una edicion, reflejamos su nombre completo como nombre del usuario
  // (solo mientras el usuario no lo haya escrito manualmente ya, igual que proveedores).
  onPersonaSubformChange(resumen: PersonaResumen) {
    if (this.estadoPersona !== 'nueva' && !this.isEditMode) {
      return;
    }
    this.formulario.patchValue({
      nomUsuario: resumen.nombreCompleto
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
    const estadoActivo = this.formulario.get('activo')?.value;

    this.formulario.patchValue({
      fechaMod: new Date().toISOString(),
      activo: !!estadoActivo,
      // La empresa nunca se selecciona: siempre es la de la sesion actual.
      idEmp: this.loginService.getIdEmpresaActual(),
    });

    if (this.estadoPersona === 'pendiente') {
      this.notificacion.showError('Debes buscar una persona existente o crear una nueva antes de guardar.');
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.agregarLogAuditoria();

    const dataCompleta = this.formulario.getRawValue();
    const personaEditable = this.isEditMode || this.estadoPersona === 'nueva';
    const jsonParaAPI = {
      ...dataCompleta,
      searchPersona: undefined,
      // Clave en blanco durante una edicion = no cambiarla (el backend lo respeta).
      clave: dataCompleta.clave ? dataCompleta.clave : undefined,
      persona: personaEditable
        ? PersonaComponent.aPayload(dataCompleta.persona)
        : undefined,
    };

    if (this.isEditMode) {
      this.usuarioService.edit(jsonParaAPI, this.objeto.idUsuario!, this.loginService.getIdEmpresaActual()!).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Usuario editado con éxito!');
          this.router.navigate(['/administracion']);
        },
        error: (err) => {
          console.error('Error al editar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el usuario.');
        }
      });
    } else {
      this.usuarioService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Usuario guardado con éxito!');
          this.router.navigate(['/administracion']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el usuario.');
        }
      });
    }
  }

}
