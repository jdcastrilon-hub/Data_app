import { Component, forwardRef, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { CompraOrigenBusqueda } from '../../../../core/interfaces/Compras/CompraOrigenBusqueda';
import { DevolucionComprasService } from '../../../../core/services/Compras/devolucion-compras.service';

// Autocompletar de "compra origen" para la devolucion a proveedor: propio del
// modulo de compras (no de uso general), ya que depende de un proveedor ya
// seleccionado y busca contra el endpoint de devoluciones.
@Component({
  selector: 'combo-compra-origen',
  imports: [CommonModule, MatInputModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboCompraOrigenComponent),
      multi: true,
    },
  ],
  templateUrl: './combo-compra-origen.component.html',
  styleUrl: './combo-compra-origen.component.scss'
})
export class ComboCompraOrigenComponent implements OnInit, ControlValueAccessor {

  // Compra origen solo tiene sentido acotada a un proveedor ya elegido.
  idProveedor = input<number | null>(null);

  compraOrigenSeleccionada = output<CompraOrigenBusqueda | null>();

  searchControl = new FormControl();

  filteredOptions = signal<CompraOrigenBusqueda[]>([]);

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(private devolucionService: DevolucionComprasService) {
  }

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const idProveedor = this.idProveedor();
        if (!idProveedor) {
          return of([]);
        }
        const texto = typeof value === 'string' ? value : undefined;
        return this.devolucionService.comprasOrigen(idProveedor, texto);
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

  mascaraSalida(compra: CompraOrigenBusqueda): string {
    if (compra && compra.idTrans) {
      return `OC ${compra.nroDocum} - ${compra.remito}`;
    }
    return '';
  }

  onSelected(event: MatAutocompleteSelectedEvent) {
    const seleccion = event.option.value;
    this.searchControl.setValue(seleccion);
    this.searchControl.disable();
    this.onChange(seleccion);
    this.compraOrigenSeleccionada.emit(seleccion);
  }

  limpiarCompraOrigen(event: Event) {
    event.stopPropagation();
    this.searchControl.enable();
    this.searchControl.setValue(null);
    this.filteredOptions.set([]);
    this.onChange(null);
    this.compraOrigenSeleccionada.emit(null);
  }

  // Permite al padre reiniciar el campo (ej: al cambiar o limpiar el proveedor)
  resetCampo(): void {
    this.searchControl.enable();
    this.searchControl.setValue(null);
    this.filteredOptions.set([]);
  }
}
