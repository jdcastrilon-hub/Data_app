import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MonitorVentaReportePreciosDetalle } from 'src/app/core/interfaces/Comercial/MonitorVentaReportePreciosDetalle';
import { AjustePrecio } from 'src/app/core/models/Ventas/AjustePrecio';
import { AjusteprecioService } from 'src/app/core/services/Ventas/ajusteprecio.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';

export interface DialogData {
  titulo: string;
  objecto_modal: MonitorVentaReportePreciosDetalle;
}

@Component({
  selector: 'ajusteprecio',
  imports: [MatDialogModule, modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, MatDatepickerModule],
  templateUrl: './ajusteprecio.component.html',
  styleUrl: './ajusteprecio.component.scss'
})
export class AjusteprecioComponent {

  formulario!: FormGroup;
  objeto!: AjustePrecio;

  @ViewChild('precioNuevoInput') precioNuevoInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AjusteprecioComponent>,
    private logAuditoria: AuditoriaService,
    private ajusteservice: AjusteprecioService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.objeto = new AjustePrecio();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.precioNuevoInput.nativeElement.focus();
    }, 300);
  }

  ngOnInit(): void {
    const valorPrecio = this.data.objecto_modal.precio || 0;

    const precioFormateado = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2
    }).format(Number(valorPrecio));

    this.formulario = this.fb.group({
      idTrans: this.objeto.idTrans,
      idEmp: this.objeto.idEmp,
      fecDoc: [new Date(), Validators.required],
      idLista: this.data.objecto_modal.idlista,
      nomLista: this.data.objecto_modal.lista,
      impPrecioActual: this.data.objecto_modal.precio,
      impPrecioActualFormateado: precioFormateado,
      impPrecioNuevo: [this.objeto.impPrecioNuevo, Validators.required],
      idArticulo: this.data.objecto_modal.idarticulo,
      nomArticulo: `${this.data.objecto_modal.codarticulo} - ${this.data.objecto_modal.nomarticulo}`,
      documento: this.objeto.documento,
      observaciones: [this.objeto.observaciones, Validators.required],
      vista: this.objeto.vista,
      fechaMod: this.objeto.fechaMod,
      logs: this.fb.array([]),
    }, { validators: this.precioDebeSerDiferenteValidator });
  }

  // Un ajuste de precio existe para corregir el precio a un valor DISTINTO
  // (mayor o menor) - no tiene sentido "ajustar" al mismo precio que ya tiene.
  private precioDebeSerDiferenteValidator(group: AbstractControl): ValidationErrors | null {
    const actual = Number(group.get('impPrecioActual')?.value);
    const nuevo = group.get('impPrecioNuevo')?.value;
    if (nuevo === null || nuevo === undefined || nuevo === '') {
      return null;
    }
    if (Number(nuevo) === actual) {
      return { precioIgual: true };
    }
    return null;
  }

  agregarLogAuditoria() {
    const logData = this.logAuditoria.generarLog('Nuevo');

    const auditoriaGroup = this.fb.group({
      operacion: [logData.operacion],
      usuario_mod: [logData.usuario_mod],
      fecha_mod: [logData.fecha_mod]
    });

    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.push(auditoriaGroup);
  }

  enviarFormulario() {
    const fecha_envio = new Date()

    this.formulario.patchValue({
      idEmp: this.loginService.getIdEmpresaActual(),
      documento: 'ajusteprec',
      vista: 'AjustePrecio',
      fechaMod: fecha_envio.toISOString()
    });

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.agregarLogAuditoria();

    const dataParaApi = this.formulario.getRawValue();

    delete dataParaApi.nomLista;
    delete dataParaApi.nomArticulo;
    delete dataParaApi.impPrecioActualFormateado;

    this.ajusteservice.save(dataParaApi).subscribe({
      next: (resultado) => {
        this.notificacion.showSuccess('Ajuste de precio aplicado con éxito!');
        this.dialogRef.close(this.formulario.getRawValue());
      },
      error: (err) => {
        this.notificacion.showError(err.error?.message || 'Error al aplicar el ajuste de precio.');
        console.error('Error al guardar:', err);
      }
    });
  }

}
