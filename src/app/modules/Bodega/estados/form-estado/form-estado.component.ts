import { Component, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Estado } from '../../../../core/models/Bodega/Estado';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { EstadosService } from '../../../../core/services/Bodega/estados.service';
import { LoginService } from '../../../../core/services/core/login.service';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from '../../../../core/services/core/notificaciones.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'form-estado',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatCheckboxModule],
  templateUrl: './form-estado.component.html',
  styleUrl: './form-estado.component.scss'
})
export class FormEstadoComponent {

  formulario!: FormGroup;
  titulo_form!: string;

  //parametros de entrada
  objeto!: Estado;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  // Referencia al FormGroupDirective: resetForm() limpia también el estado
  // "submitted", que formulario.reset() no toca (por eso volvían a verse errores).
  @ViewChild('formDirective') formDirective!: NgForm;

  //constructor
  constructor(
    private fb: FormBuilder,
    private estadoService: EstadosService,
    private loginService: LoginService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.objeto = new Estado();
  }

  // Vuelve al listado. El filtro/pagina en el que se quedo la lista se restaura
  // desde EstadoListStateService (no desde el historial del navegador: se puede
  // llegar a este formulario desde cualquier otra pantalla, no solo desde la lista).
  volver(): void {
    this.router.navigate(['/estados']);
  }

  ngOnInit(): void {
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      id: [this.objeto.id],
      // La empresa no se selecciona: siempre es la de la sesion actual
      // (LoginService.getIdEmpresaActual()), asignada al enviar el formulario.
      idEmpresa: [this.objeto.idEmpresa],
      codEstado: [this.objeto.codEstado, Validators.required],
      nomEstado: [this.objeto.nomEstado, Validators.required],
      activo: [this.objeto.activo],
      observacion: [this.objeto.observacion, Validators.required],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
    });

    // No se usa formulario.disable(): los inputs de texto usan [readonly] en la
    // plantilla (se ven normales, no apagados/grises). El checkbox "activo" es la
    // excepción: HTML no tiene un "readonly" real para el, asi que se deshabilita
    // individualmente.
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
        this.titulo_form = this.isReadOnly ? "DETALLE ESTADO" : "ACTUALIZACION ESTADO";
        this.ModoEdicion(Number(id)); // Llama al método de carga
      } else {
        // Si no hay ID, estamos en modo Nuevo
        this.isEditMode = false;
        this.objeto = new Estado();
        this.titulo_form = "REGISTRO DE ESTADO";
        this.formulario.get('activo')?.patchValue(true);
        this.formulario.get('idEmpresa')?.patchValue(this.loginService.getIdEmpresaActual());
      }
    });
  }

  /**
  * Metodo para cargar la informacion del estado por el (id)
  * @returns No tiene return
  */
  ModoEdicion(id: number): void {
    //llama el API para recuperar el objecto estado
    this.estadoService.getEstadoById(id).subscribe(
      (data: Estado) => {
        this.objeto = data; // Cargar la data del estado en el formulario
        this.formulario.get('id')?.patchValue(data.id);
        this.formulario.get('idEmpresa')?.patchValue(data.idEmpresa);
        this.formulario.get('codEstado')?.patchValue(data.codEstado);
        this.formulario.get('nomEstado')?.patchValue(data.nomEstado);
        this.formulario.get('activo')?.patchValue(data.activo);
        this.formulario.get('observacion')?.patchValue(data.observacion);
        this.cargarLogsExistentes(data.logs);
      },
      error => {
        console.error('Error al cargar el estado:', error);
        this.router.navigate(['/estados']);
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
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Auditoria
    this.agregarLogAuditoria();

    if (this.isEditMode) {
      //Evento Edicion
      this.estadoService.edit(this.formulario.getRawValue(), this.objeto.id!).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Estado editado con éxito!');
          this.router.navigate(['/estados']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el estado.');
        }
      });
    } else {
      //Evento nuevo
      const dataCompleta = this.formulario.getRawValue();
      const { id, ...bodyJson } = dataCompleta;
      this.estadoService.save(bodyJson).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Estado creado con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el estado.');
        }
      });
    }
  }

  // Limpia el formulario para dejarlo listo para un nuevo registro.
  resetCampos(): void {
    this.objeto = new Estado();
    this.formDirective.resetForm();
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
        titulo: `Historial de Auditoría - ${this.objeto.codEstado}`,
        logs: this.formulario.get('logs')?.value
      }
    });

    // Material devuelve el foco al boton que abrio el dialogo al cerrarlo (accesibilidad),
    // lo que deja el icono con el resaltado de "enfocado" pegado visualmente.
    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }

  // Método para agregar el log al FormArray
  agregarLogAuditoria() {
    // 1. Obtienes el objeto de log ya completo y formateado del servicio
    const logData = this.logAuditoria.generarLog(!this.isEditMode ? 'Nuevo' : 'Edicion');

    // 2. Creas un nuevo FormGroup usando la data
    const auditoriaGroup = this.fb.group({
      operacion: [logData.operacion],
      usuario_mod: [logData.usuario_mod],
      fecha_mod: [logData.fecha_mod]
    });

    // 3. Lo añades al FormArray
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.push(auditoriaGroup);
  }

}
