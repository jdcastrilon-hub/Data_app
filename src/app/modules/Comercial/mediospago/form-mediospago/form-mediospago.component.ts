import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BancoCombo } from 'src/app/core/interfaces/Tesoreria/BancoCombo';
import { MediosPago } from 'src/app/core/models/Ventas/MediosPago';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { MediospagoService } from 'src/app/core/services/Ventas/mediospago.service';
import { BancosService } from 'src/app/core/services/Tesoreria/bancos.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'app-form-mediospago',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule],
  templateUrl: './form-mediospago.component.html',
  styleUrl: './form-mediospago.component.scss'
})
export class FormMediospagoComponent {

  formulario!: FormGroup;
  objeto!: MediosPago;
  titulo_form: string = 'REGISTRO DE MEDIO DE PAGO';
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  // Banco donde liquida este medio de pago (opcional - solo aplica a
  // Transferencia/Tarjeta, Efectivo se deja sin seleccionar).
  list_bancos: BancoCombo[] = [];
  SelectBancoControl = new FormControl<BancoCombo | null>(null);

  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private mediospagoService: MediospagoService,
    private bancosService: BancosService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router) {
    this.objeto = new MediosPago();
  }

  volver(): void {
    this.router.navigate(['/mediospago']);
  }

  ngOnInit() {
    // idEmp no se pide en el formulario: se toma de la sesion (LoginService) al
    // crear/editar, ver enviarFormulario() - mismo patron que estados/categorias.
    this.formulario = this.fb.group({
      id: [this.objeto.id],
      idEmp: [this.objeto.idEmp],
      tipo: [this.objeto.tipo, Validators.required],
      orden: [this.objeto.orden],
      idBanco: [this.objeto.idBanco],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([])
    });

    // No se usa formulario.disable(): los inputs usan [readonly] en la plantilla.
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.SelectBancoControl.disable();
    }

    this.SelectBancoControl.valueChanges.subscribe(banco => {
      this.formulario.patchValue({ idBanco: banco?.idBanco ?? null });
    });

    this.cargarBancos();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE MEDIO DE PAGO' : 'ACTUALIZACION MEDIO DE PAGO';
        this.ModoEdicion(Number(id));
      } else {
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO DE MEDIO DE PAGO';
        this.objeto = new MediosPago();
        this.formulario.patchValue({ idEmp: this.loginService.getIdEmpresaActual() });
      }
    });
  }

  ModoEdicion(id: number): void {
    this.mediospagoService.getMedioPagoById(id).subscribe({
      next: (data: MediosPago) => {
        this.objeto = data;

        this.cargarLogsExistentes(data.logs);

        this.formulario.patchValue({
          id: data.id,
          idEmp: data.idEmp,
          tipo: data.tipo,
          orden: data.orden,
          idBanco: data.idBanco
        });

        this.preseleccionarBanco();
      },
      error: (err) => {
        console.error('Error al cargar el medio de pago:', err);
        this.router.navigate(['/mediospago']);
      }
    });
  }

  // El combo de bancos y la carga del medio de pago son dos llamadas async
  // independientes - se intenta preseleccionar desde ambos lados (el que
  // termine de ultimo es el que realmente logra marcar la opcion).
  cargarBancos(): void {
    this.bancosService.listCombo().subscribe({
      next: (data) => {
        this.list_bancos = data;
        this.preseleccionarBanco();
      },
      error: (err) => console.error('Error cargando bancos', err)
    });
  }

  preseleccionarBanco(): void {
    if (!this.isEditMode || !this.objeto.idBanco || this.list_bancos.length === 0) {
      return;
    }
    const bancoSeleccionado = this.list_bancos.find(b => b.idBanco === this.objeto.idBanco);
    if (bancoSeleccionado) {
      this.SelectBancoControl.setValue(bancoSeleccionado, { emitEvent: false });
    }
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
        titulo: `Historial de Auditoría - ${this.objeto.tipo}`,
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
      idEmp: this.loginService.getIdEmpresaActual(),
      fechaMod: new Date().toISOString()
    });

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.agregarLogAuditoria();

    const jsonParaAPI = this.formulario.getRawValue();

    if (this.isEditMode) {
      this.mediospagoService.edit(this.objeto.id!, jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Medio de pago actualizado con éxito!');
          this.router.navigate(['/mediospago']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el medio de pago.');
        }
      });
    } else {
      this.mediospagoService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Medio de pago guardado con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el medio de pago.');
        }
      });
    }
  }

  resetCampos() {
    this.objeto = new MediosPago();
    this.formDirective.resetForm();
    this.SelectBancoControl.setValue(null, { emitEvent: false });
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    this.formulario.patchValue({ idEmp: this.loginService.getIdEmpresaActual() });
  }

}
