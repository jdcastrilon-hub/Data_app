import { Component, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MedioPago } from 'src/app/core/models/Ventas/medioPago';

interface LineaPago {
  formaPago: string;
  valor: number;
  observacion: string;
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

  list_mediospago: MedioPago[] = [];
  SelecmediosControl = new FormControl<MedioPago | null>(null, Validators.required);

  //Entrada
  totalFactura = input.required<number>();
  mediospago = input.required<any>();

  //Salida
  pagosActualizados = output<LineaPago[]>();


  // Opciones disponibles para el Select
  opcionesPago = ['Efectivo', 'Tarjeta Credito', 'Tarjeta Debito', 'Transferencia'];

  // Inicializamos la tabla con una fila por defecto en "Efectivo"
  lineasPago = signal<LineaPago[]>([
    { formaPago: 'Efectivo', valor: 0, observacion: '' }
  ]);

  // Columnas fijas de la tabla
  displayedColumns: string[] = ['formaPago', 'valor', 'observacion', 'acciones'];

  ngOnInit() {
    console.log("medios de pago")
    console.log(this.mediospago());

  }

  constructor() {
    // Un effect en Angular 19 reacciona automáticamente cada vez que las lineasPago cambian
    // y notifica inmediatamente al componente padre.
    effect(() => {
      this.pagosActualizados.emit(this.lineasPago());
    });
  }

  

  // Agregar una nueva línea vacía a la tabla
  agregarLinea() {
    this.lineasPago.update(lineas => [
      ...lineas,
      { formaPago: 'Efectivo', valor: 0, observacion: '' }
    ]);
  }

  // Eliminar una línea específica (opcional, pero útil para control)
  eliminarLinea(index: number) {
    if (this.lineasPago().length > 1) {
      this.lineasPago.update(lineas => lineas.filter((_, i) => i !== index));
    } else {
      // Si es la última, solo la reseteamos
      this.lineasPago.set([{ formaPago: 'Efectivo', valor: 0, observacion: '' }]);
    }
  }

  // Forzar la actualización de la tabla cuando cambia un input interno
  actualizarValor() {
    this.lineasPago.update(lineas => [...lineas]);
  }

  // Calculamos la suma de todos los valores ingresados
  totalIngresado = computed(() => {
    return this.lineasPago().reduce((acc, linea) => acc + (linea.valor || 0), 0);
  });

  // Calculamos la devuelta global si el total ingresado supera al de la factura
  devueltaGoblal = computed(() => {
    const cambio = this.totalIngresado() - this.totalFactura();
    return cambio > 0 ? cambio : 0;
  });
}