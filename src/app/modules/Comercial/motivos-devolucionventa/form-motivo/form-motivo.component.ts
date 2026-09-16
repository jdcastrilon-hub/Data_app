import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MotivoDevolucionVenta } from '../../../../core/models/Comercial/MotivoDevolucionVenta';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { MotivosDevolucionVentaService } from '../../../../core/services/Ventas/motivos-devolucionventa.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'form-motivo-devolucionventa',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatCheckboxModule],
  templateUrl: './form-motivo.component.html',
  styleUrl: './form-motivo.component.scss'
})
export class FormMotivoDevolucionVentaComponent {

  formulario!: FormGroup;
  titulo_form!: string;

  objeto!: MotivoDevolucionVenta;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  // Los 6 conceptos oficiales de nota credito/debito de la DIAN (Anexo Tecnico
  // Factura Electronica v1.9, 13.2.7.4/13.2.7.5) - opcional, solo referencia.
  list_codigosDian = [
    { valor: 1, nombre: '1 - Devolución parcial de bienes' },
    { valor: 2, nombre: '2 - Anulación de factura electrónica' },
    { valor: 3, nombre: '3 - Rebaja o descuento parcial o total' },
    { valor: 4, nombre: '4 - Ajuste de precio' },
    { valor: 5, nombre: '5 - Descuento comercial por pronto pago' },
    { valor: 6, nombre: '6 - Descuento comercial por volumen de ventas' },
  ];

  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(
    private fb: FormBuilder,
    private motivoService: MotivosDevolucionVentaService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.objeto = new MotivoDevolucionVenta();
  }

  volver(): void {
    this.router.navigate(['/motivosdevolucionventa']);
  }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      idMotivo: [this.objeto.idMotivo],
      idEmp: [this.objeto.idEmp],
      codMotivo: [this.objeto.codMotivo],
      nomMotivo: [this.objeto.nomMotivo, Validators.required],
      devuelveDinero: [false],
      // codigoDian: referencia al concepto oficial DIAN (1-6) - opcional, solo
      // informativo mientras no se emita factura electronica. Un motivo puede
      // no tener uno fijo (ej. "Ajuste de Valor" cubre 2 conceptos a la vez).
      codigoDian: [this.objeto.codigoDian ?? null],
      afectaStock: [true],
      activo: [this.objeto.activo],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.get('activo')?.disable();
      this.formulario.get('devuelveDinero')?.disable();
      this.formulario.get('codigoDian')?.disable();
      this.formulario.get('afectaStock')?.disable();
    }

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? "DETALLE MOTIVO DE DEVOLUCION VENTA" : "ACTUALIZACION MOTIVO DE DEVOLUCION VENTA";
        this.ModoEdicion(Number(id));

      } else {
        this.isEditMode = false;
        this.titulo_form = "REGISTRO DE MOTIVOS DE DEVOLUCION VENTA";
        this.objeto = new MotivoDevolucionVenta();
        this.formulario.get('activo')?.patchValue(true);
      }
    });
  }

  ModoEdicion(id: number): void {
    this.motivoService.getMotivoById(id).subscribe(
      (data: MotivoDevolucionVenta) => {
        this.objeto = data;
        this.formulario.get('idMotivo')?.patchValue(data.idMotivo);
        this.formulario.get('idEmp')?.patchValue(data.idEmp);
        this.formulario.get('codMotivo')?.patchValue(data.codMotivo);
        this.formulario.get('nomMotivo')?.patchValue(data.nomMotivo);
        this.formulario.get('devuelveDinero')?.patchValue(data.devuelveDinero);
        this.formulario.get('codigoDian')?.patchValue(data.codigoDian ?? null);
        this.formulario.get('afectaStock')?.patchValue(data.afectaStock);
        this.formulario.get('activo')?.patchValue(data.activo === 'S');
        this.cargarLogsExistentes(data.logs);
      },
      error => {
        console.error('Error al cargar el motivo:', error);
        this.router.navigate(['/motivosdevolucionventa']);
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
        titulo: `Historial de Auditoría - ${this.objeto.codMotivo}`,
        logs: this.formulario.get('logs')?.value
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }

  enviarFormulario() {
    const estadoActivo = this.formulario.get('activo')?.value;

    this.formulario.patchValue({
      idEmp: this.loginService.getIdEmpresaActual(),
      fechaMod: new Date().toISOString(),
      activo: estadoActivo ? 'S' : 'N',
    });

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.agregarLogAuditoria();

    if (this.isEditMode) {
      this.motivoService.edit(this.formulario.getRawValue(), this.objeto.idMotivo!).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Motivo editado con éxito!');
          this.router.navigate(['/motivosdevolucionventa']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el motivo.');
        }
      });

    } else {
      const dataCompleta = this.formulario.getRawValue();
      const { idMotivo, ...bodyJson } = dataCompleta;
      this.motivoService.save(bodyJson).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Motivo creado con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el motivo.');
        }
      });
    }
  }

  resetCampos(): void {
    this.objeto = new MotivoDevolucionVenta();
    this.formDirective.resetForm();
    this.formulario.get('activo')?.patchValue(true);

    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
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

}
