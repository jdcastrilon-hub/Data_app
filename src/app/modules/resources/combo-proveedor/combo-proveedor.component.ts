import { Component, forwardRef, input, OnInit, output, signal } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { ProveedorSearch } from '../../../core/interfaces/Compras/ProveedorSearch';
import { debounceTime, distinctUntilChanged, finalize, Observable, of, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ProveedorService } from '../../../core/services/Compras/proveedor.service';

@Component({
  selector: 'combo-proveedor',
  imports: [MatInputModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboProveedorComponent),
      multi: true,
    },
  ],
  templateUrl: './combo-proveedor.component.html',
  styleUrl: './combo-proveedor.component.scss'
})

export class ComboProveedorComponent implements OnInit, ControlValueAccessor {

  //Parametros de entrada
  input_objeto = input<any>(null);
  editMode = input<boolean>(false);

  //salidas
  proveedorSelecionado = output<ProveedorSearch>();

  searchControl = new FormControl();

  filteredOptions = signal<ProveedorSearch[]>([]);

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(private fb: FormBuilder,
    private proveedorservice: ProveedorService) {
  }

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length > 2) {
          return this.proveedorservice.ProveedorSearch(value);
        }
        return of([]);
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


  mascaraSalida(proveedor: ProveedorSearch): string {
    console.log('Lo que recibe el autocomplete:', proveedor);
    if (proveedor && proveedor.idProveedor != 0) {
      // Devuelve el código y el nombre para una mejor referencia visual
      return `${proveedor.nombreCompleto} - ${proveedor.codTit}`;
    }
    return ''; // Devuelve cadena vacía si no hay objeto (ej: cuando el input está vacío)
  }

  onSelected(event: MatAutocompleteSelectedEvent) {
    const seleccion = event.option.value;
    this.onChange(seleccion); // Notifica al FormControl del padre
    this.proveedorSelecionado.emit(seleccion);
  }

}
