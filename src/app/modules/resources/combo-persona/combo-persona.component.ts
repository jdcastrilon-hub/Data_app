import { Component, EventEmitter, forwardRef, Input, input, OnInit, Output, output, signal, ViewChild } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { PersonaSearch } from 'src/app/core/interfaces/Compras/PersonaSearch';
import { PersonaService } from 'src/app/core/services/Compras/persona.service';

@Component({
  selector: 'combo-persona',
  imports: [MatInputModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboPersonaComponent),
      multi: true,
    },
  ],
  templateUrl: './combo-persona.component.html',
  styleUrl: './combo-persona.component.scss'
})
export class ComboPersonaComponent implements OnInit, ControlValueAccessor {

  //Parametros de entrada
  input_objeto = input<any>(null);
  editMode = input<boolean>(false);
  @Input() mostrarOpcionCrear = false;

  //salidas
  personaSelecionado = output<PersonaSearch>();
  @Output() crearNuevo = new EventEmitter<string>();

  searchControl = new FormControl();

  filteredOptions = signal<PersonaSearch[]>([]);

  onChange: any = () => { };
  onTouched: any = () => { };

  //Para referenciar el autoCompletar
  @ViewChild(MatAutocompleteTrigger) trigger!: MatAutocompleteTrigger;

  constructor(private fb: FormBuilder,
    private personaservice: PersonaService) {
  }

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length > 2) {
          return this.personaservice.PersonaSearch(value);
        }
        return of([]);
      })
    ).subscribe(data => this.filteredOptions.set(data));
  }

  writeValue(obj: any): void {
    console.log('writeValue:', obj);
    if (obj) {
      this.searchControl.setValue(obj, { emitEvent: false });

      // El hijo se cierra a sí mismo cuando recibe datos
      setTimeout(() => this.cerrarPanel());
    }
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


  mascaraSalida(persona: PersonaSearch): string {
    console.log('Lo que recibe el autocomplete:', persona);
    if (persona && persona.codTit.length > 0) {
      // Devuelve el código y el nombre para una mejor referencia visual
      return `${persona.nombreCompleto} - ${persona.codTit}`;
    }
    return ''; // Devuelve cadena vacía si no hay objeto (ej: cuando el input está vacío)
  }

  onSelected(event: MatAutocompleteSelectedEvent) {
    const seleccion = event.option.value;
    this.searchControl.setValue(seleccion); // Seteamos el objeto
    this.searchControl.disable();
    this.onChange(seleccion); // Notifica al FormControl del padre
    this.personaSelecionado.emit(seleccion);
  }

  limpiarPersona(event: Event) {
    event.stopPropagation();
    this.searchControl.enable();
    this.searchControl.setValue(null); // Limpiamos el input
    this.filteredOptions.set([]);      // Limpiamos las sugerencias
    this.onChange(null);               // Notificamos al formulario padre
    this.personaSelecionado.emit(null as any); // Avisamos al monitor
  }

  cerrarPanel() {
    if (this.trigger) {
      this.trigger.closePanel();
    }
  }

}
