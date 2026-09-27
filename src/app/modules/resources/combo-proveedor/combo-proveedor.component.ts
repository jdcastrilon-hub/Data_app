import { Component, effect, forwardRef, input, OnInit, output, signal } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormBuilder, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { ProveedorSearch } from '../../../core/interfaces/Compras/ProveedorSearch';
import { debounceTime, distinctUntilChanged, finalize, Observable, of, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ProveedorService } from '../../../core/services/Compras/proveedor.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'combo-proveedor',
  imports: [MatInputModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatIconModule],
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
  // Este combo se reutiliza en pantallas donde el proveedor es opcional (ej.
  // filtro del Monitor de Compras, sin formControlName) - el required NO
  // puede ser incondicional o rompe esos usos. Cada formulario que si lo
  // necesite obligatorio lo activa explicitamente con [requerido]="true"
  // (hoy: Compra Directa).
  requerido = input<boolean>(false);

  //salidas
  proveedorSelecionado = output<ProveedorSearch>();

  searchControl = new FormControl<any>(null);

  filteredOptions = signal<ProveedorSearch[]>([]);

  onChange: any = () => { };
  onTouched: any = () => { };

  // El valor de searchControl NUNCA es null mientras nadie interactua con el
  // campo: writeValue() lo inicializa con el objeto sentinela del padre
  // ({idProveedor:0, ...}), que es un objeto real, no null/undefined -
  // Validators.required jamas lo detecta como "vacio" (bug real: dejar
  // Proveedor intacto no marcaba error, aunque si funcionaba al escribir algo
  // y borrarlo con la "X", que si deja el control en null). Se valida el
  // idProveedor del propio objeto en su lugar, mismo criterio que
  // validarProveedorSeleccionado en form-compra-directa.
  private validarProveedorReal = (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    return valor && valor.idProveedor ? null : { required: true };
  };

  constructor(private fb: FormBuilder,
    private proveedorservice: ProveedorService) {
    // Sin proveedor seleccionado no hay compra/devolucion valida - antes esto
    // solo lo detectaba el backend (422), sin ningun indicio visual en el
    // campo (bug real reportado). Se activa/desactiva segun "requerido" en
    // vez de ponerlo fijo en el FormControl, para no afectar los usos donde
    // el proveedor es opcional (ver comentario de "requerido" arriba).
    effect(() => {
      if (this.requerido()) {
        this.searchControl.addValidators(this.validarProveedorReal);
      } else {
        this.searchControl.removeValidators(this.validarProveedorReal);
      }
      this.searchControl.updateValueAndValidity({ emitEvent: false });
    });
  }

  // El padre lo llama directo (ej. en enviarFormulario(), justo cuando detecta
  // que el formulario es invalido) para marcar el control interno como
  // "touched" - un metodo llamado en el momento exacto, en vez de un @Input
  // reactivo (senal) que dependia de que el ciclo de deteccion de cambios lo
  // propagara a tiempo y no llegaba a mostrarse (bug real reportado: el
  // recuadro no avisaba nada al dar "Guardar").
  marcarComoIntentado(): void {
    this.searchControl.markAsTouched();
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
    this.searchControl.setValue(seleccion); // Seteamos el objeto
    this.searchControl.disable();
    this.onChange(seleccion); // Notifica al FormControl del padre
    this.proveedorSelecionado.emit(seleccion);
  }

  limpiarProveedor(event: Event) {
    event.stopPropagation();
    this.searchControl.enable();
    this.searchControl.setValue(null); // Limpiamos el input
    this.filteredOptions.set([]);      // Limpiamos las sugerencias
    this.onChange(null);               // Notificamos al formulario padre
    this.proveedorSelecionado.emit(null as any); // Avisamos al monitor
  }

  // Permite al padre reiniciar el campo (ej: despues de agregar el proveedor a una lista/grilla)
  resetCampo(): void {
    this.searchControl.enable();
    this.searchControl.setValue(null);
    this.filteredOptions.set([]);
  }
}
