import { Component, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Unidad } from '../../../../core/models/Bodega/Unidad';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { UnidadServiceService } from '../../../../core/services/Bodega/unidad-service.service';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'form-unidad',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatCheckboxModule],
  templateUrl: './form-unidad.component.html',
  styleUrl: './form-unidad.component.scss'
})
export class FormUnidadComponent {

  formulario!: FormGroup;
  titulo_form!: string;

  //parametros de entrada
  objeto!: Unidad;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  // Referencia al FormGroupDirective: resetForm() limpia también el estado
  // "submitted", que formulario.reset() no toca (por eso volvían a verse errores).
  @ViewChild('formDirective') formDirective!: NgForm;

  //constructor
  constructor(
    private fb: FormBuilder,
    private unidadService: UnidadServiceService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.objeto = new Unidad();
  }

  ngOnInit(): void {
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      codUnidad: [this.objeto.codUnidad, Validators.required],
      nomUnidad: [this.objeto.nomUnidad, Validators.required],
      esPaquete: [this.objeto.esPaquete],
      convertUnidad: [this.objeto.convertUnidad, Validators.required],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
      id: [this.objeto.id],
    });

    // No se usa formulario.disable(): los inputs usan [readonly] en la plantilla
    // (se ven normales, no apagados/grises). El checkbox es la excepción: HTML no
    // tiene un "readonly" real para checkboxes, así que ese control sí se deshabilita.
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.get('esPaquete')?.disable();
    }

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        this.isEditMode = true;
        if (this.isReadOnly) {
          this.titulo_form = "DETALLE UNIDAD";
        } else {
          this.titulo_form = "ACTUALIZACION UNIDAD";
        }

        this.ModoEdicion(Number(id)); // Llama al método de carga

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        this.isEditMode = false;
        this.titulo_form = "REGISTRO DE UNIDAD";
        this.objeto = new Unidad();
        this.formulario.get('esPaquete')?.patchValue(false);
      }
    });
  }

  /**
  * Metodo para cargar la informacion de la unidad por el (id)
  */
  ModoEdicion(id: number): void {
    this.unidadService.getUnidadById(id).subscribe(
      (data: Unidad) => {
        this.objeto = data;
        this.formulario.get('id')?.patchValue(data.id);
        this.formulario.get('codUnidad')?.patchValue(data.codUnidad);
        this.formulario.get('nomUnidad')?.patchValue(data.nomUnidad);
        this.formulario.get('esPaquete')?.patchValue(data.esPaquete === 'S');
        this.formulario.get('convertUnidad')?.patchValue(data.convertUnidad);
        this.cargarLogsExistentes(data.logs);
      },
      error => {
        console.error('Error al cargar la unidad:', error);
        this.router.navigate(['/unidades']);
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
    //Asignacion de campos en cabezal
    const estadoEsPaquete = this.formulario.get('esPaquete')?.value;

    this.formulario.patchValue({
      fechaMod: new Date().toISOString(),
      esPaquete: estadoEsPaquete ? 'S' : 'N',
    });

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Auditoria
    this.agregarLogAuditoria();

    if (this.isEditMode) {
      //Evento Edicion
      this.unidadService.edit(this.formulario.getRawValue(), this.objeto.id!).subscribe({
        next: (ObjectSave) => {
          this.notificacion.showSuccess('¡Unidad editada con éxito!');
          this.router.navigate(['/unidades']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar la unidad.');
        }
      });

    } else {
      //Evento nuevo
      const dataCompleta = this.formulario.getRawValue();
      const { id, ...bodyJson } = dataCompleta;
      this.unidadService.save(bodyJson).subscribe({
        next: (ObjectSave) => {
          this.notificacion.showSuccess('¡Unidad creada con éxito!');
          // Se limpia el formulario para poder seguir registrando unidades sin salir de la pantalla
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar la unidad.');
        }
      });
    }
  }

  // Limpia el formulario y el FormGroup para dejarlo listo para un nuevo registro
  resetCampos(): void {
    this.objeto = new Unidad();
    this.formDirective.resetForm(); // limpia valores + estado submitted/touched
    this.formulario.get('esPaquete')?.patchValue(false);

    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
  }

  // Muestra en un dialogo el historial de auditoria del registro actual
  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - ${this.objeto.codUnidad}`,
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
