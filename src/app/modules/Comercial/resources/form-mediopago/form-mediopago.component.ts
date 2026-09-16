import { Component, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MedioPago } from 'src/app/core/models/Ventas/medioPago';

export interface LineaPago {
  idMediopago: number;
  tipo: string;
  valor: number;
}

@Component({
  selector: 'form-mediopago',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './form-mediopago.component.html',
  styleUrl: './form-mediopago.component.scss'
})
export class FormMediopagoComponent {

  // Total real de la factura, para validar que la suma de las lineas cuadre.
  totalFactura = input.required<number>();
  // Medios de pago reales (m_mediopagos), reemplaza la lista hardcodeada que
  // tenia este componente antes ('Efectivo', 'Tarjeta Credito', ...) - ahora
  // cada linea guarda idMediopago, el mismo dato que ya usa el resto del
  // sistema (td_cierreturno, p_movimientocajas).
  mediospago = input.required<MedioPago[]>();
  // Para modo edicion/vista: precarga las lineas ya guardadas de la venta.
  lineasIniciales = input<LineaPago[]>([]);

  pagosActualizados = output<LineaPago[]>();

  lineasPago = signal<LineaPago[]>([]);

  displayedColumns: string[] = ['formaPago', 'valor', 'acciones'];

  // Sin esto, mat-table rastrea las filas por identidad de objeto - como
  // actualizarValor()/actualizarMedio() reemplazan la linea editada por un
  // objeto nuevo en cada cambio, la fila se destruye y se vuelve a crear en
  // cada tecla, perdiendo el foco del input. Rastrear por indice (estable
  // mientras no se agregue/quite una fila) evita esa recreacion.
  trackByIndex(index: number): number {
    return index;
  }

  constructor() {
    // Precarga las lineas cuando llegan (edicion) - solo una vez que traen datos.
    effect(() => {
      const iniciales = this.lineasIniciales();
      if (iniciales.length > 0) {
        this.lineasPago.set(iniciales.map(l => ({ ...l })));
      }
    }, { allowSignalWrites: true });

    // Cada vez que cambian las lineas, se notifica al formulario padre.
    effect(() => {
      this.pagosActualizados.emit(this.lineasPago());
    });
  }

  ngOnInit() {
    if (this.lineasPago().length === 0 && this.lineasIniciales().length === 0) {
      this.agregarLinea();
    }
  }

  agregarLinea() {
    const primerMedio = this.mediospago()[0];
    this.lineasPago.update(lineas => [
      ...lineas,
      { idMediopago: primerMedio?.id ?? 0, tipo: primerMedio?.tipo ?? '', valor: 0 }
    ]);
  }

  // Se llama desde el formulario padre (resetCampos()) tras un guardado exitoso.
  // El componente no se destruye/recrea entre ventas si "Pago Mixto" sigue
  // seleccionado (el @if del padre no cambia), asi que su estado interno
  // (lineasPago) sobrevive al reset del formulario a menos que se limpie aca.
  resetear() {
    const primerMedio = this.mediospago()[0];
    this.lineasPago.set([{ idMediopago: primerMedio?.id ?? 0, tipo: primerMedio?.tipo ?? '', valor: 0 }]);
  }

  eliminarLinea(index: number) {
    if (this.lineasPago().length > 1) {
      this.lineasPago.update(lineas => lineas.filter((_, i) => i !== index));
    } else {
      const primerMedio = this.mediospago()[0];
      this.lineasPago.set([{ idMediopago: primerMedio?.id ?? 0, tipo: primerMedio?.tipo ?? '', valor: 0 }]);
    }
  }

  // El <select> del template emite solo el id numerico (option [ngValue]="medio.id"),
  // no el objeto MedioPago completo - hay que buscar el tipo correspondiente aca.
  actualizarMedio(index: number, idMediopago: number) {
    const medio = this.mediospago().find(m => m.id === idMediopago);
    this.lineasPago.update(lineas => lineas.map((l, i) =>
      i === index ? { ...l, idMediopago, tipo: medio?.tipo ?? '' } : l
    ));
  }

  actualizarValor(index: number, valor: number) {
    this.lineasPago.update(lineas => lineas.map((l, i) =>
      i === index ? { ...l, valor: Number(valor) || 0 } : l
    ));
  }

  // Formatea "Valor" con separador de miles en vivo mientras se escribe - mismo
  // patron ya usado en "Base"/"Valor Ingreso"/"Importe". No se usa [ngModel] aca
  // (un input type=text con comas se leeria como texto crudo, no numero) - se
  // parsea el valor directo desde el evento nativo y se llama actualizarValor().
  onValorInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '');
    const valorNumerico = soloDigitos ? Number(soloDigitos) : 0;
    this.actualizarValor(index, valorNumerico);
    input.value = soloDigitos ? valorNumerico.toLocaleString('es-CO') : '';
  }

  // Formatea el valor de una fila recien agregada o precargada en edicion.
  formatearValor(valor: number): string {
    return valor ? valor.toLocaleString('es-CO') : '';
  }

  // La fila vacia recien agregada no debe verse en rojo antes de que el usuario
  // la toque - mismo criterio ya usado en otras grillas (ver validarCantidadPositiva
  // de venta-directa).
  filasTocadas = new Set<number>();
  marcarTocado(index: number): void {
    this.filasTocadas.add(index);
  }

  // Suma de lo que el usuario ha distribuido entre las lineas.
  totalIngresado = computed(() => {
    return this.lineasPago().reduce((acc, linea) => acc + (linea.valor || 0), 0);
  });

  // Diferencia contra el total real de la factura (0 = cuadra exacto).
  diferencia = computed(() => Math.round((this.totalFactura() - this.totalIngresado()) * 100) / 100);

  // El backend valida esto igual antes de grabar - se muestra en pantalla para
  // que el usuario no tenga que intentar guardar para enterarse.
  sumaValida = computed(() => Math.abs(this.diferencia()) < 0.01);

  // Solo tiene sentido "vuelto" si el usuario distribuyo mas de lo que cuesta
  // la factura (ej. pago con efectivo redondeado y espera cambio).
  devueltaGoblal = computed(() => {
    const cambio = this.totalIngresado() - this.totalFactura();
    return cambio > 0 ? cambio : 0;
  });
}
