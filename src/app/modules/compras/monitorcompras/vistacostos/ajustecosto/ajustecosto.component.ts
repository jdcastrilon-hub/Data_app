import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MonitorCompraReporteCostosDetalle } from 'src/app/core/interfaces/Compras/MonitorCompraReporteCostosDetalle';
import { AjusteCostos } from 'src/app/core/models/Compras/AjusteCostos';
import { ArticuloService } from 'src/app/core/services/Bodega/articulo.service';
import { AjustecostoService } from 'src/app/core/services/Compras/ajustecosto.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { BodegaService } from 'src/app/core/services/Bodega/bodega.service';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';

export interface DialogData {
  titulo: string;
  mensaje: string;
  objecto_modal: MonitorCompraReporteCostosDetalle;
}


@Component({
  selector: 'ajustecosto',
  imports: [MatDialogModule, modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, MatDatepickerModule],
  templateUrl: './ajustecosto.component.html',
  styleUrl: './ajustecosto.component.scss'
})
export class AjustecostoComponent {

  //Variables Generales
  formulario!: FormGroup;
  objeto!: AjusteCostos;

  @ViewChild('costoNuevoInput') costoNuevoInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AjustecostoComponent>,
    private logAuditoria: AuditoriaService,
    private ajusteservice: AjustecostoService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private bodegaService: BodegaService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.objeto = new AjusteCostos();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.costoNuevoInput.nativeElement.focus();
    }, 300);
  }

  ngOnInit(): void {
    console.log("AjustecostoComponent");
    console.log(this.data);

    //Se instancias las variables para el formulario
    const valorCosto = this.data.objecto_modal.costo || 0;

    // 2. Formatea asegurándote que es un número
    const costoFormateado = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2
    }).format(Number(valorCosto));

    this.formulario = this.fb.group({
      idTrans: this.objeto.idTrans,
      idEmp: this.objeto.idEmp,
      fecDoc: [new Date(), Validators.required],
      idBodega: this.data.objecto_modal.idbodega,
      nomBodega: this.data.objecto_modal.bodega,
      impCostoActual: this.data.objecto_modal.costo,
      impCostoActualFormateado: costoFormateado,
      impCostoNuevo: [this.objeto.impCostoNuevo, Validators.required],
      idArticulo: this.data.objecto_modal.idarticulo,
      nomArticulo: `${this.data.objecto_modal.codarticulo} - ${this.data.objecto_modal.nomarticulo}`,
      documento: this.objeto.documento,
      observaciones: [this.objeto.observaciones, Validators.required],
      vista: this.objeto.vista,
      fechaMod: this.objeto.fechaMod,
      logs: this.fb.array([]),
    }, { validators: this.costoDebeSerDiferenteValidator });

    // Articulo sin bodega asociada todavia (nunca tuvo movimiento en ninguna
    // bodega, ej. recien creado) - la fila del reporte llega con idbodega nulo.
    // En vez de dejar el ajuste sin poder grabarse, se asume la bodega
    // principal de la empresa (mismo criterio que combo-bodega usa para
    // documentos nuevos: primer elemento de listSelection(), que el backend
    // ya ordena con la principal de primera - ver Bodega.principal).
    if (!this.data.objecto_modal.idbodega) {
      this.bodegaService.listSelection().subscribe({
        next: (bodegas) => {
          const principal = bodegas[0];
          if (principal) {
            this.formulario.patchValue({ idBodega: principal.id, nomBodega: principal.nomBodega });
          }
        },
        error: (err) => console.error('Error cargando bodega principal', err)
      });
    }
  }

  // Un ajuste de costo existe para corregir el costo a un valor DISTINTO
  // (mayor o menor) - no tiene sentido "ajustar" al mismo costo que ya tiene.
  private costoDebeSerDiferenteValidator(group: AbstractControl): ValidationErrors | null {
    const actual = Number(group.get('impCostoActual')?.value);
    const nuevo = group.get('impCostoNuevo')?.value;
    if (nuevo === null || nuevo === undefined || nuevo === '') {
      return null; // el required de impCostoNuevo ya cubre este caso
    }
    if (Number(nuevo) === actual) {
      return { costoIgual: true };
    }
    return null;
  }

  // Método para agregar el log al FormArray
  agregarLogAuditoria() {
    // 1. Obtienes el objeto de log ya completo y formateado del servicio
    const logData = this.logAuditoria.generarLog('Nuevo');

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



  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario");
    const fecha_envio = new Date()

    this.formulario.patchValue({
      idEmp: this.loginService.getIdEmpresaActual(),
      documento: 'ajustecos',
      vista: 'AjusteCosto',
      fechaMod: fecha_envio.toISOString()
    });

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //agregar log
    this.agregarLogAuditoria();

    const dataParaApi = this.formulario.getRawValue();

    // Borramos lo que el API no debe recibir
    delete dataParaApi.nomBodega;
    delete dataParaApi.nomArticulo;
    delete dataParaApi.impCostoActualFormateado;

    console.log(dataParaApi)
    this.ajusteservice.save(dataParaApi).subscribe({
      next: (compra) => {
        // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
        console.log(compra);
        this.notificacion.showSuccess('Ajuste Aplicado con éxito!');
        this.dialogRef.close(this.formulario.getRawValue());
      },
      error: (err) => {
        this.notificacion.showError('Error Aplicado ajuste!');
        console.error('Error al guardar:', err);
      }
    });

  }

  private findInvalidControls() {
    const invalid = [];
    const controls = this.formulario.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    console.log('Campos inválidos:', invalid);
    return invalid;
  }


}
