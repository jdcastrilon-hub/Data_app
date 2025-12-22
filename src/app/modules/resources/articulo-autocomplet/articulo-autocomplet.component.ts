import { Component, forwardRef, OnInit, output, signal } from '@angular/core';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ArticuloSearch } from '../../../core/models/Bodega/ArticuloSearch';
import { ArticuloServiceService } from '../../../core/services/Bodega/articulo-service.service';
import { ControlValueAccessor, FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'articulo-autocomplet',
  imports: [CommonModule, ReactiveFormsModule, MatAutocompleteModule, MatInputModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ArticuloAutocompletComponent),
      multi: true,
    },
  ],
  templateUrl: './articulo-autocomplet.component.html',
  styleUrl: './articulo-autocomplet.component.scss'
})
export class ArticuloAutocompletComponent implements OnInit, ControlValueAccessor {

  list_articulos_search: ArticuloSearch[] = [];
  articuloSeleccionado = output<ArticuloSearch>();

  // Variable para el ID de la bodega (debe venir del formulario principal)
  bodegaSeleccionadaId: number = 1; // ID de la Bodega activa

  isLoading = false;

  filteredOptions = signal<ArticuloSearch[]>([]);

  searchControl = new FormControl();

  // Callbacks para ControlValueAccessor
  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(private articuloService: ArticuloServiceService,
    private fb: FormBuilder
  ) { }
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

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length > 2) {
          return this.articuloService.Search(value);
        }
        return of([]);
      })
    ).subscribe(data => this.filteredOptions.set(data));
  }

  onSelected(event: MatAutocompleteSelectedEvent) {
    const seleccion = event.option.value;
    this.onChange(seleccion); // Notifica al FormControl del padre
    this.articuloSeleccionado.emit(seleccion);
  }

  mascaraSalida(articulo: ArticuloSearch): string {
    console.log('Lo que recibe el autocomplete:', articulo);
    if (articulo && articulo.idArticulo != 0) {
      // Devuelve el código y el nombre para una mejor referencia visual
      return `${articulo.codArticulo} - ${articulo.nomArticulo}`;
    }
    return ''; // Devuelve cadena vacía si no hay objeto (ej: cuando el input está vacío)
  }

}
