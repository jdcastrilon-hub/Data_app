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

  eliminarLinea(index: number) {
    if (this.lineasPago().length > 1) {
      this.lineasPago.update(lineas => lineas.filter((_, i) => i !== index));
    } else {
      const primerMedio = this.mediospago()[0];
      this.lineasPago.set([{ idMediopago: primerMedio?.id ?? 0, tipo: primerMedio?.tipo ?? '', valor: 0 }]);
    }
  }

  actualizarMedio(index: number, medio: MedioPago) {
    this.lineasPago.update(lineas => lineas.map((l, i) =>
      i === index ? { ...l, idMediopago: medio.id, tipo: medio.tipo } : l
    ));
  }

  actualizarValor(index: number, valor: number) {
    this.lineasPago.update(lineas => lineas.map((l, i) =>
      i === index ? { ...l, valor: Number(valor) || 0 } : l
    ));
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
