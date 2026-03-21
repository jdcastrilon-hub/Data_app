import { Component, input, OnInit, output, signal } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { ArticuloSearch } from 'src/app/core/models/Bodega/ArticuloSearch';
import { ArticuloServiceService } from 'src/app/core/services/Bodega/articulo-service.service';

@Component({
  selector: 'combo-articulo',
  imports: [MatInputModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule],
  templateUrl: './combo-articulo.component.html',
  styleUrl: './combo-articulo.component.scss'
})
export class ComboArticuloComponent implements OnInit, ControlValueAccessor {

  //Parametros de entrada
  input_objeto = input<any>(null);
  editMode = input<boolean>(false);

  //salidas
  articuloSeleccionado = output<ArticuloSearch>();

  searchControl = new FormControl();

  filteredOptions = signal<ArticuloSearch[]>([]);

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(private fb: FormBuilder,
    private articuloService: ArticuloServiceService) {
  }

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length > 2) {
          return this.articuloService.SearchArticulo(value);
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


  mascaraSalida(articulo: ArticuloSearch): string {
    console.log('Lo que recibe el autocomplete:', articulo);
    if (articulo && articulo.idArticulo != 0) {
      // Devuelve el código y el nombre para una mejor referencia visual
      return `${articulo.nomArticulo} - ${articulo.codArticulo}`;
    }
    return ''; // Devuelve cadena vacía si no hay objeto (ej: cuando el input está vacío)
  }

  onSelected(event: MatAutocompleteSelectedEvent) {
    const seleccion = event.option.value;
    this.onChange(seleccion); // Notifica al FormControl del padre
    this.articuloSeleccionado.emit(seleccion);
  }

}
