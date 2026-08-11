import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Impuesto } from '../../../../core/models/Impuestos/Impuesto';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { TasaImpuestoService } from '../../../../core/services/impuestos/tasa-impuesto.service';
import { TipoImpuestoCombo } from '../../../../core/interfaces/Impuestos/TipoImpuestoCombo';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'form-impuesto',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule],
  templateUrl: './form-impuesto.component.html',
  styleUrl: './form-impuesto.component.scss'
})
export class FormImpuestoComponent {

  formulario!: FormGroup;
  titulo_form!: string;

  //parametros de entrada
  objeto!: Impuesto;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  //Tipos de impuesto (catalogo global, sin CRUD propio)
  list_tipos: TipoImpuestoCombo[] = [];

  // Referencia al FormGroupDirective: resetForm() limpia también el estado
  // "submitted", que formulario.reset() no toca.
  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(
    private fb: FormBuilder,
    private impuestoService: TasaImpuestoService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.objeto = new Impuesto();
  }

  // Vuelve al listado. El filtro/pagina en el que se quedo la lista se restaura
  // desde ImpuestoListStateService.
  volver(): void {
    this.router.navigate(['/impuestos']);
  }

  ngOnInit(): void {
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      id: [this.objeto.id],
      // No se selecciona: siempre es la empresa de la sesion actual.
      idEmp: [this.objeto.idEmp],
      idTipo: [this.objeto.idTipo, Validators.required],
      tasaImpuesto: [this.objeto.tasaImpuesto],
      // Bloqueado: se arma solo concatenando Tipo + Porcentaje (ver actualizarNombreTasa()).
      nombreTasa: [this.objeto.nombreTasa, Validators.required],
      // Sin campo en el formulario - siempre graba 'N' (no exenta). Mismo
      // criterio que impMinimo/cuentaVenta/cuentaCompra: valor fijo por defecto.
      exenta: ['N'],
      porcentaje: [this.objeto.porcentaje, [Validators.required, Validators.min(0), Validators.max(100)]],
      // Sin campos en el formulario (todavia no hay modulo contable) - valores
      // fijos por defecto, mismo criterio que ctaInventario en Motivos de Ajuste.
      impMinimo: [0],
      cuentaVenta: ['0'],
      cuentaCompra: ['0'],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
    });

    // No se usa formulario.disable(): los inputs de texto usan [readonly] en la
    // plantilla. El select es la excepcion: no tiene un "readonly" real, asi
    // que ese control si se deshabilita.
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.get('idTipo')?.disable();
    }

    this.cargarTiposImpuesto();

    // Nombre/Descripcion se recalcula solo, ante cualquier cambio de Tipo o Porcentaje.
    this.formulario.get('idTipo')?.valueChanges.subscribe(() => this.actualizarNombreTasa());
    this.formulario.get('porcentaje')?.valueChanges.subscribe(() => this.actualizarNombreTasa());

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? "DETALLE DE IMPUESTO" : "ACTUALIZACION DE IMPUESTO";
        this.ModoEdicion(Number(id));

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        this.isEditMode = false;
        this.titulo_form = "REGISTRO DE IMPUESTO";
        this.objeto = new Impuesto();
      }
    });
  }

  cargarTiposImpuesto(): void {
    this.impuestoService.listTiposImpuesto().subscribe({
      next: (data) => {
        this.list_tipos = data;
        // Si ya habia un idTipo cargado (edicion) antes de que el combo terminara
        // de llegar, recalcula ahora que ya se puede resolver el nombre del tipo.
        this.actualizarNombreTasa();
      },
      error: (err) => console.error('Error cargando tipos de impuesto', err)
    });
  }

  // Arma "Nombre / Descripcion" solo, concatenando el tipo seleccionado + el
  // porcentaje (ej. "IVA" + 19 -> "IVA 19%"). El campo queda bloqueado en la
  // plantilla: el usuario nunca lo escribe a mano.
  actualizarNombreTasa(): void {
    const idTipo = this.formulario.get('idTipo')?.value;
    const porcentaje = this.formulario.get('porcentaje')?.value;
    const tipo = this.list_tipos.find(t => t.id === idTipo);

    if (!tipo || porcentaje === null || porcentaje === undefined || porcentaje === '') {
      return;
    }

    this.formulario.get('nombreTasa')?.setValue(`${tipo.nombreTipo} ${porcentaje}%`, { emitEvent: false });
  }

  /**
  * Metodo para cargar la informacion del impuesto por el (id)
  */
  ModoEdicion(id: number): void {
    this.impuestoService.getImpuestoById(id).subscribe(
      (data: Impuesto) => {
        this.objeto = data;
        this.formulario.patchValue({
          id: data.id,
          idEmp: data.idEmp,
          idTipo: data.idTipo,
          tasaImpuesto: data.tasaImpuesto,
          nombreTasa: data.nombreTasa,
          porcentaje: data.porcentaje,
          // exenta/impMinimo/cuentaVenta/cuentaCompra no se cargan del registro
          // existente: quedan siempre en su valor fijo por defecto (ver ngOnInit).
        });
        // Refuerzo explicito: patchValue ya dispara la suscripcion de idTipo/porcentaje,
        // pero si el combo de tipos (cargarTiposImpuesto) todavia no habia llegado en
        // ese momento, list_tipos estaria vacio y no se podria resolver el nombre.
        this.actualizarNombreTasa();
        this.cargarLogsExistentes(data.logs);
      },
      error => {
        console.error('Error al cargar el impuesto:', error);
        this.router.navigate(['/impuestos']);
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
        titulo: `Historial de Auditoría - ${this.objeto.nombreTasa}`,
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
    this.formulario.patchValue({
      idEmp: this.loginService.getIdEmpresaActual(),
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
      this.impuestoService.edit(this.formulario.getRawValue(), this.objeto.id!).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Impuesto editado con éxito!');
          this.router.navigate(['/impuestos']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el impuesto.');
        }
      });

    } else {
      //Evento nuevo
      const dataCompleta = this.formulario.getRawValue();
      const { id, ...bodyJson } = dataCompleta;
      this.impuestoService.save(bodyJson).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Impuesto creado con éxito!');
          // Se limpia el formulario para poder seguir registrando impuestos sin salir de la pantalla
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el impuesto.');
        }
      });
    }
  }

  // Limpia el formulario y el FormGroup para dejarlo listo para un nuevo registro
  resetCampos(): void {
    this.objeto = new Impuesto();
    this.formDirective.resetForm(); // limpia valores + estado submitted/touched (incluye exenta/impMinimo/cuentaVenta/cuentaCompra, que vuelven a su default fijo)

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
