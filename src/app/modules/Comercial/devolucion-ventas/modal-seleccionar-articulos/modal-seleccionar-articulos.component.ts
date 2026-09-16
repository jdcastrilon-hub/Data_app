import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LineaDisponibleNotaCredito } from 'src/app/core/interfaces/Comercial/LineaDisponibleNotaCredito';
import { DevolucionVentasService } from 'src/app/core/services/Ventas/devolucion-ventas.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';

export interface LineaSeleccionada {
  linea: number;
  idArticulo: number;
  idCodBarra: number;
  idLote: number;
  codLote: string;
  codArticulo: string;
  nomArticulo: string;
  cantidadVendida: number;
  cantidad: number;
  precioUnit: number;
  impuesto1: string;
  idTasaimp1: number;
  valorImpuesto1: number;
  impuesto2: string;
  valorImpuesto2: number;
  impuesto3: string;
  valorImpuesto3: number;
  impNeto: number;
  impTotal: number;
}

export interface ModalSeleccionarArticulosData {
  idTransRef: number;
  // Lineas ya agregadas a la grilla del formulario (si se reabre la modal para
  // ajustar la seleccion, quedan pre-marcadas con su cantidad actual).
  lineasYaAgregadas: LineaSeleccionada[];
  // Al editar una nota existente: su propio idTrans, para que el backend no se
  // reste a si misma del acumulado "ya devuelto" de esta factura origen.
  excluirIdTrans?: number;
}

@Component({
  selector: 'modal-seleccionar-articulos',
  imports: [modules_depencias, MatDialogModule, MatCheckboxModule, ReactiveFormsModule, FlexLayoutModule, FormsModule],
  templateUrl: './modal-seleccionar-articulos.component.html',
  styleUrl: './modal-seleccionar-articulos.component.scss'
})
export class ModalSeleccionarArticulosComponent {

  formulario!: FormGroup;
  cargando = true;
  listaLineas: LineaDisponibleNotaCredito[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalSeleccionarArticulosComponent>,
    private devolucionService: DevolucionVentasService,
    private notificacion: NotificacionesService,
    @Inject(MAT_DIALOG_DATA) public data: ModalSeleccionarArticulosData
  ) {
    this.formulario = this.fb.group({
      lineas: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.devolucionService.lineasDisponibles(this.data.idTransRef, this.data.excluirIdTrans).subscribe({
      next: (data) => {
        this.listaLineas = data;
        this.construirFilas();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando lineas de la factura origen', err);
        this.cargando = false;
      }
    });
  }

  get lineas(): FormArray {
    return this.formulario.get('lineas') as FormArray;
  }

  construirFilas(): void {
    const array = this.lineas;
    array.clear();

    this.listaLineas.forEach(linea => {
      const previa = this.data.lineasYaAgregadas?.find(l =>
        l.idArticulo === linea.idArticulo && l.idCodBarra === linea.idCodBarra && l.idLote === linea.idLote
      );

      // A diferencia de devolucion a proveedor, aca NO hay tope de stock fisico:
      // la mercancia ENTRA a bodega en vez de salir. El unico tope es el saldo
      // de la factura (lo vendido menos lo ya devuelto en notas previas).
      const maxDevolver = linea.cantidadVendida;

      const fila = this.fb.group({
        linea: [linea.linea],
        idArticulo: [linea.idArticulo],
        idCodBarra: [linea.idCodBarra],
        idLote: [linea.idLote],
        codLote: [linea.codLote],
        codArticulo: [linea.codArticulo],
        nomArticulo: [linea.nomArticulo],
        manejaLote: [linea.manejaLote],
        cantidadVendida: [linea.cantidadVendida],
        precioUnit: [linea.precioUnit],
        impuesto1: [linea.impuesto1],
        idTasaimp1: [linea.idTasaimp1],
        porcTasa1: [linea.porcTasa1],
        maxDevolver: [maxDevolver],
        seleccionado: [!!previa],
        cantidad: [previa?.cantidad ?? maxDevolver, [this.validarCantidad]]
      });

      // Si no queda saldo para devolver de esta linea (ya se devolvio todo antes),
      // no se puede seleccionar en absoluto.
      if (maxDevolver <= 0) {
        fila.get('seleccionado')?.disable();
      }

      array.push(fila);
    });
  }

  /**
   * Validador: si la fila esta seleccionada, la cantidad debe ser mayor a 0 y no
   * puede superar el saldo disponible de esa linea.
   */
  validarCantidad = (control: AbstractControl): ValidationErrors | null => {
    const fila = control.parent;
    const seleccionado = fila?.get('seleccionado')?.value;
    if (!seleccionado) {
      return null;
    }
    const maxDevolver = fila?.get('maxDevolver')?.value ?? 0;
    const valor = Number(control.value);
    if (!valor || valor <= 0) {
      return { requerido: true };
    }
    if (valor > maxDevolver) {
      return { excedeMaximo: true };
    }
    return null;
  };

  onSeleccionadoChange(fila: AbstractControl): void {
    fila.get('cantidad')?.updateValueAndValidity();
  }

  confirmar(): void {
    const seleccionadas = this.lineas.controls.filter(f => f.get('seleccionado')?.value);

    if (seleccionadas.length === 0) {
      this.notificacion.showError('Selecciona al menos un artículo para devolver.');
      return;
    }

    const invalida = seleccionadas.some(f => f.get('cantidad')?.invalid);
    if (invalida) {
      this.lineas.controls.forEach(f => f.get('cantidad')?.markAsTouched());
      this.notificacion.showError('Revisa las cantidades marcadas en rojo antes de continuar.');
      return;
    }

    const resultado: LineaSeleccionada[] = seleccionadas.map(f => {
      const valor = f.getRawValue();
      const cantidad = Number(valor.cantidad);
      const impNeto = Math.round(valor.precioUnit * cantidad * 100) / 100;
      const valorImpuesto1 = Math.round(impNeto * (Number(valor.porcTasa1) / 100) * 100) / 100;
      return {
        linea: valor.linea,
        idArticulo: valor.idArticulo,
        idCodBarra: valor.idCodBarra,
        idLote: valor.idLote,
        codLote: valor.codLote,
        codArticulo: valor.codArticulo,
        nomArticulo: valor.nomArticulo,
        cantidadVendida: valor.cantidadVendida,
        cantidad: cantidad,
        precioUnit: valor.precioUnit,
        impuesto1: valor.impuesto1,
        idTasaimp1: valor.idTasaimp1,
        valorImpuesto1: valorImpuesto1,
        impuesto2: 'N/A',
        valorImpuesto2: 0,
        impuesto3: 'N/A',
        valorImpuesto3: 0,
        impNeto: impNeto,
        impTotal: impNeto + valorImpuesto1
      };
    });

    this.dialogRef.close(resultado);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

}
