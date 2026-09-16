import { Component, forwardRef, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { FacturaOrigenBusqueda } from 'src/app/core/interfaces/Comercial/FacturaOrigenBusqueda';
import { DevolucionVentasService } from 'src/app/core/services/Ventas/devolucion-ventas.service';

// Autocompletar de "factura origen" para la nota credito: propio de Comercial
// (no de uso general), ya que depende de un cliente ya seleccionado y busca
// contra el endpoint de devolucionventas. Mismo patron que combo-compra-origen
// (Compras).
@Component({
  selector: 'combo-venta-origen',
  imports: [CommonModule, MatInputModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboVentaOrigenComponent),
      multi: true,
    },
  ],
  templateUrl: './combo-venta-origen.component.html',
  styleUrl: './combo-venta-origen.component.scss'
})
export class ComboVentaOrigenComponent implements OnInit, ControlValueAccessor {

  // Factura origen solo tiene sentido acotada a un cliente ya elegido.
  idCliente = input<number | null>(null);

  facturaOrigenSeleccionada = output<FacturaOrigenBusqueda | null>();

  searchControl = new FormControl();

  filteredOptions = signal<FacturaOrigenBusqueda[]>([]);

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(private devolucionService: DevolucionVentasService) {
  }

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const idCliente = this.idCliente();
        if (!idCliente) {
          return of([]);
        }
        const texto = typeof value === 'string' ? value : undefined;
        return this.devolucionService.facturasOrigen(idCliente, texto);
      })
    ).subscribe(data => this.filteredOptions.set(data));
  }

  writeValue(obj: any): void {
    this.searchControl.setValue(obj, { emitEvent: false });
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.searchControl.disable({ emitEvent: false });
    } else {
      this.searchControl.enable({ emitEvent: false });
    }
  }

  mascaraSalida(factura: FacturaOrigenBusqueda): string {
    if (factura && factura.idTrans) {
      return `Factura ${factura.serie}-${factura.nroDocum}`;
    }
    return '';
  }

  onSelected(event: MatAutocompleteSelectedEvent) {
    const seleccion = event.option.value;
    this.searchControl.setValue(seleccion);
    this.searchControl.disable();
    this.onChange(seleccion);
    this.facturaOrigenSeleccionada.emit(seleccion);
  }

  limpiarFacturaOrigen(event: Event) {
    event.stopPropagation();
    this.searchControl.enable();
    this.searchControl.setValue(null);
    this.filteredOptions.set([]);
    this.onChange(null);
    this.facturaOrigenSeleccionada.emit(null);
  }

  // Permite al padre reiniciar el campo (ej: al cambiar o limpiar el cliente)
  resetCampo(): void {
    this.searchControl.enable();
    this.searchControl.setValue(null);
    this.filteredOptions.set([]);
  }
}
