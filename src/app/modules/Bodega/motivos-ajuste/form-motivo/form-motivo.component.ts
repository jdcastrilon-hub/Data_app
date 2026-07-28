import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MotivosAjuste } from '../../../../core/models/Bodega/MotivosAjuste';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { MotivosAjusteService } from '../../../../core/services/Bodega/motivos-ajuste.service';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'form-motivo',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatRadioModule, MatCheckboxModule],
  templateUrl: './form-motivo.component.html',
  styleUrl: './form-motivo.component.scss'
})
export class FormMotivoComponent {

  formulario!: FormGroup;
  titulo_form!: string;

  //parametros de entrada
  objeto!: MotivosAjuste;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  // Referencia al FormGroupDirective: resetForm() limpia también el estado
  // "submitted", que formulario.reset() no toca.
  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(
    private fb: FormBuilder,
    private motivoService: MotivosAjusteService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.objeto = new MotivosAjuste();
  }

  // Vuelve al listado. El filtro/pagina en el que se quedo la lista se restaura
  // desde MotivoListStateService (no desde el historial del navegador: se puede
  // llegar a este formulario desde cualquier otra pantalla, no solo desde la lista).
  volver(): void {
    this.router.navigate(['/motivosajuste']);
  }

  ngOnInit(): void {
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      idMotivo: [this.objeto.idMotivo],
      codMotivo: [this.objeto.codMotivo, Validators.required],
      nomMotivo: [this.objeto.nomMotivo, Validators.required],
      signo: [this.objeto.signo, Validators.required],
      activo: [this.objeto.activo],
      ctaInventario: [this.objeto.ctaInventario, Validators.required],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
    });

    // No se usa formulario.disable(): los inputs de texto usan [readonly] en la
    // plantilla (se ven normales, no apagados/grises). El checkbox y el grupo de
    // radio son la excepción: HTML no tiene un "readonly" real para ellos, así
    // que esos controles sí se deshabilitan individualmente.
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.get('activo')?.disable();
      this.formulario.get('signo')?.disable();
    }

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? "DETALLE MOTIVO DE AJUSTE" : "ACTUALIZACION MOTIVO DE AJUSTE";
        this.ModoEdicion(Number(id));

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        this.isEditMode = false;
        this.titulo_form = "REGISTRO DE MOTIVOS DE AJUSTE";
        this.objeto = new MotivosAjuste();
        this.formulario.get('activo')?.patchValue(true);
      }
    });
  }

  /**
  * Metodo para cargar la informacion del motivo por el (id)
  */
  ModoEdicion(id: number): void {
    this.motivoService.getMotivoById(id).subscribe(
      (data: MotivosAjuste) => {
        this.objeto = data;
        this.formulario.get('idMotivo')?.patchValue(data.idMotivo);
        this.formulario.get('codMotivo')?.patchValue(data.codMotivo);
        this.formulario.get('nomMotivo')?.patchValue(data.nomMotivo);
        this.formulario.get('signo')?.patchValue(data.signo);
        this.formulario.get('activo')?.patchValue(data.activo === 'S');
        this.formulario.get('ctaInventario')?.patchValue(data.ctaInventario);
        this.cargarLogsExistentes(data.logs);
      },
      error => {
        console.error('Error al cargar el motivo:', error);
        this.router.navigate(['/motivosajuste']);
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
        titulo: `Historial de Auditoría - ${this.objeto.codMotivo}`,
        logs: this.formulario.get('logs')?.value
      }
    });

    // Material devuelve el foco al boton que abrio el dialogo al cerrarlo (accesibilidad),
    // lo que deja el icono con el resaltado de "enfocado" pegado visualmente.
    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }

  enviarFormulario() {
    //Asignacion de campos en cabezal
    const estadoActivo = this.formulario.get('activo')?.value;

    this.formulario.patchValue({
      fechaMod: new Date().toISOString(),
      activo: estadoActivo ? 'S' : 'N',
    });

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Auditoria
    this.agregarLogAuditoria();

    if (this.isEditMode) {
      //Evento Edicion
      this.motivoService.edit(this.formulario.getRawValue(), this.objeto.idMotivo!).subscribe({
        next: (ObjectSave) => {
          this.notificacion.showSuccess('¡Motivo editado con éxito!');
          this.router.navigate(['/motivosajuste']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el motivo.');
        }
      });

    } else {
      //Evento nuevo
      const dataCompleta = this.formulario.getRawValue();
      const { idMotivo, ...bodyJson } = dataCompleta;
      this.motivoService.save(bodyJson).subscribe({
        next: (ObjectSave) => {
          this.notificacion.showSuccess('¡Motivo creado con éxito!');
          // Se limpia el formulario para poder seguir registrando motivos sin salir de la pantalla
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el motivo.');
        }
      });
    }
  }

  // Limpia el formulario y el FormGroup para dejarlo listo para un nuevo registro
  resetCampos(): void {
    this.objeto = new MotivosAjuste();
    this.formDirective.resetForm(); // limpia valores + estado submitted/touched
    this.formulario.get('activo')?.patchValue(true);

    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
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
