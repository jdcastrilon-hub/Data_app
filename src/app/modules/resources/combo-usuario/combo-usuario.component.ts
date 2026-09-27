import { Component, forwardRef, input, OnInit, output, signal } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { UsuarioSearch } from 'src/app/core/interfaces/Core/UsuarioSearch';
import { UsuariosService } from 'src/app/core/services/core/usuarios.service';

@Component({
  selector: 'combo-usuario',
  imports: [MatInputModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboUsuarioComponent),
      multi: true,
    },
  ],
  templateUrl: './combo-usuario.component.html',
  styleUrl: './combo-usuario.component.scss'
})
export class ComboUsuarioComponent implements OnInit, ControlValueAccessor {

  //Parametros de entrada
  input_objeto = input<any>(null);
  editMode = input<boolean>(false);
  // false (default) = modo grilla: cada seleccion agrega una fila y el campo
  // se limpia de inmediato (roles/sucursales/cajas/conceptos, sin tocar ese
  // comportamiento). true = selección única persistente, mismo patrón que
  // combo-cliente: el nombre queda en el campo (deshabilitado) hasta que se
  // limpia con la "X" - para un campo tipo "cobrador" de un solo valor.
  seleccionUnica = input<boolean>(false);

  //salidas
  usuarioSelecionado = output<UsuarioSearch>();

  searchControl = new FormControl();

  filteredOptions = signal<UsuarioSearch[]>([]);

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(private fb: FormBuilder,
    private usuariosService: UsuariosService) {
  }

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length > 2) {
          return this.usuariosService.usuarioSearch(value)
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

  mascaraSalida(usuario: UsuarioSearch): string {
    if (usuario && usuario.idUsuario) {
      return `${usuario.nombreCompleto} - ${usuario.usuario}`;
    }
    return '';
  }

  onSelected(event: MatAutocompleteSelectedEvent) {
    const seleccion = event.option.value;
    this.searchControl.setValue(seleccion);

    if (this.seleccionUnica()) {
      // Deja el nombre en el campo (deshabilitado) - mismo patron que combo-cliente.
      this.searchControl.disable();
      this.onChange(seleccion);
    } else {
      // Se limpia de inmediato: cada seleccion agrega una fila a la grilla, no queda "elegido" en el campo.
      this.searchControl.setValue(null);
      this.onChange(null);
    }

    this.usuarioSelecionado.emit(seleccion);
  }

  limpiarBusqueda(event: Event) {
    event.stopPropagation();
    if (this.seleccionUnica()) {
      this.searchControl.enable();
    }
    this.searchControl.setValue(null);
    this.filteredOptions.set([]);
    this.onChange(null);
    if (this.seleccionUnica()) {
      this.usuarioSelecionado.emit(null as any);
    }
  }
}
