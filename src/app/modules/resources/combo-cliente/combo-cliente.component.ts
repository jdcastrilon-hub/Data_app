import { Component, effect, forwardRef, input, OnInit, output, signal } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { ClienteSearch } from 'src/app/core/interfaces/Comercial/ClienteSearch';
import { ClientesService } from 'src/app/core/services/Ventas/clientes.service';

@Component({
  selector: 'combo-cliente',
  imports: [MatInputModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboClienteComponent),
      multi: true,
    },
  ],
  templateUrl: './combo-cliente.component.html',
  styleUrl: './combo-cliente.component.scss'
})
export class ComboClienteComponent implements OnInit, ControlValueAccessor {

//Parametros de entrada
  input_objeto = input<any>(null);
  editMode = input<boolean>(false);
  // Cuando el padre lo pone en true (ej. tras un intento de guardar sin cliente),
  // pinta el recuadro en rojo igual que cualquier otro campo requerido de Material -
  // no genera texto de error propio, el padre es responsable de avisar al usuario.
  mostrarError = input<boolean>(false);

  //salidas
  clienteSelecionado = output<ClienteSearch>();

  searchControl = new FormControl();

  filteredOptions = signal<ClienteSearch[]>([]);

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(private fb: FormBuilder,
    private clienteservice: ClientesService) {
    effect(() => {
      if (this.mostrarError()) {
        this.searchControl.markAsTouched();
        this.searchControl.setErrors({ requerido: true });
      } else if (this.searchControl.hasError('requerido')) {
        this.searchControl.setErrors(null);
      }
    });
  }

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length > 2) {
          return this.clienteservice.ClienteSearch(value)
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


  mascaraSalida(cliente: ClienteSearch): string {
    console.log('Lo que recibe el autocomplete:', cliente);
    if (cliente && cliente.idCliente != 0) {
      // Devuelve el código y el nombre para una mejor referencia visual
      return `${cliente.nombreCompleto} - ${cliente.codTit}`;
    }
    return ''; // Devuelve cadena vacía si no hay objeto (ej: cuando el input está vacío)
  }

  onSelected(event: MatAutocompleteSelectedEvent) {
    const seleccion = event.option.value;
    this.searchControl.setValue(seleccion); // Seteamos el objeto
    this.searchControl.disable();
    this.onChange(seleccion); // Notifica al FormControl del padre
    this.clienteSelecionado.emit(seleccion);
  }

  limpiarProveedor(event: Event) {
    event.stopPropagation();
    this.searchControl.enable();
    this.searchControl.setValue(null); // Limpiamos el input
    this.filteredOptions.set([]);      // Limpiamos las sugerencias
    this.onChange(null);               // Notificamos al formulario padre
    this.clienteSelecionado.emit(null as any); // Avisamos al monitor
  }
}

