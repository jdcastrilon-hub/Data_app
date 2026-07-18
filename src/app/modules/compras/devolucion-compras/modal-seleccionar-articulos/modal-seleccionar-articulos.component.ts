import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LineaDisponibleDevolucion } from 'src/app/core/interfaces/Compras/LineaDisponibleDevolucion';
import { DevolucionComprasService } from 'src/app/core/services/Compras/devolucion-compras.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';

export interface LineaSeleccionada {
  linea: number;
  idArticulo: number;
  idCodBarra: number;
  idLote: number;
  codLote: string;
  codArticulo: string;
  nomArticulo: string;
  cantidadComprada: number;
  cantidad: number;
  costoUnit: number;
  costoTotal: number;
}

export interface ModalSeleccionarArticulosData {
  idCompraOrigen: number;
  // Lineas ya agregadas a la grilla del formulario (si se reabre la modal para
  // ajustar la seleccion, quedan pre-marcadas con su cantidad actual).
  lineasYaAgregadas: LineaSeleccionada[];
  // Al editar una devolucion existente: su propio idTrans, para que el backend no
  // se reste a si misma del acumulado "ya devuelto" de esta compra origen.
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
  listaLineas: LineaDisponibleDevolucion[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalSeleccionarArticulosComponent>,
    private devolucionService: DevolucionComprasService,
    private notificacion: NotificacionesService,
    @Inject(MAT_DIALOG_DATA) public data: ModalSeleccionarArticulosData
  ) {
    this.formulario = this.fb.group({
      lineas: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.devolucionService.lineasDisponibles(this.data.idCompraOrigen, this.data.excluirIdTrans).subscribe({
      next: (data) => {
        this.listaLineas = data;
        this.construirFilas();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando lineas de la compra origen', err);
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

      // El maximo devolvible es lo que sea MENOR entre lo comprado en esta compra
      // origen y el stock disponible actual: no se puede devolver mas de lo que se
      // compro aqui (aunque haya mas stock, puede venir de otra compra), ni mas de
      // lo que realmente queda en existencia (si ya se vendio parte, no esta).
      const maxDevolver = Math.min(linea.cantidadComprada, linea.stockDisponible);

      const fila = this.fb.group({
        linea: [linea.linea],
        idArticulo: [linea.idArticulo],
        idCodBarra: [linea.idCodBarra],
        idLote: [linea.idLote],
        codLote: [linea.codLote],
        codArticulo: [linea.codArticulo],
        nomArticulo: [linea.nomArticulo],
        manejaLote: [linea.manejaLote],
        cantidadComprada: [linea.cantidadComprada],
        costoUnit: [linea.costoUnit],
        stockDisponible: [linea.stockDisponible],
        maxDevolver: [maxDevolver],
        seleccionado: [!!previa],
        cantidad: [previa?.cantidad ?? maxDevolver, [this.validarCantidad]]
      });

      // Si no hay nada valido para devolver de esta linea (nada comprado aqui
      // que siga en stock), no se puede seleccionar en absoluto.
      if (maxDevolver <= 0) {
        fila.get('seleccionado')?.disable();
      }

      array.push(fila);
    });
  }

  /**
   * Validador: si la fila esta seleccionada, la cantidad debe ser mayor a 0 y no
   * puede superar el maximo devolvible (min entre lo comprado y el disponible).
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
      return {
        linea: valor.linea,
        idArticulo: valor.idArticulo,
        idCodBarra: valor.idCodBarra,
        idLote: valor.idLote,
        codLote: valor.codLote,
        codArticulo: valor.codArticulo,
        nomArticulo: valor.nomArticulo,
        cantidadComprada: valor.cantidadComprada,
        cantidad: cantidad,
        costoUnit: valor.costoUnit,
        costoTotal: Math.round(valor.costoUnit * cantidad * 100) / 100
      };
    });

    this.dialogRef.close(resultado);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

}
