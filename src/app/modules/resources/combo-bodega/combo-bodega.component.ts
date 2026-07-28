import { Component, effect, Input, input, output } from '@angular/core';
import { ControlEvent, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { BodegaService } from '../../../core/services/Bodega/bodega.service';
import { BodegaCombo } from 'src/app/core/interfaces/Bodega/BodegaCombo';

@Component({
  selector: 'combo-bodega',
  imports: [MatInputModule, MatSelectModule, FormsModule, ReactiveFormsModule],
  templateUrl: './combo-bodega.component.html',
  styleUrl: './combo-bodega.component.scss'
})
export class ComboBodegaComponent {

  //Parametros de entrada Signal Input
  input_objeto = input<any>(null);
  editMode = input<boolean>(false);
  opcionview = input<boolean>(false);
  // Nombre de la propiedad de input_objeto que trae el id de la bodega seleccionada.
  // Permite reutilizar el combo en formularios con mas de una bodega (ej. traslado: origen/destino).
  campo = input<string>('idBodega');

  //Parametros de entrada Decorador
  @Input() mostrarOpcionTodas = false;


  //salidas
  bodegaSeleccionada = output<BodegaCombo>();

  //Bodegas
  list_bodegas: BodegaCombo[] = [];
  SelecBodegaControl = new FormControl<BodegaCombo | null>(null, Validators.required);

  constructor(private fb: FormBuilder,
    private bodegaService: BodegaService
  ) {
    effect(() => {
      const objeto = this.input_objeto();
      const esLectura = this.opcionview();

      // 1. Manejar el estado habilitado/deshabilitado
      if (esLectura) {
        this.SelecBodegaControl.disable({ emitEvent: false });
      } else {
        this.SelecBodegaControl.enable({ emitEvent: false });
      }

      // 2. Si el objeto cambió y ya tenemos bodegas cargadas, intentar seleccionar
      if (this.list_bodegas.length > 0) {
        this.seleccionarBodegaLogica();
      }
    });
  }

  ngOnInit(): void {
    this.cargaDatos();
  }

  cargaDatos(): void {
    this.bodegaService.listSelection().subscribe({
      next: (data) => {
        //Se recupera el Json del API
        this.list_bodegas = data;
        this.seleccionarBodegaLogica();
      },
      error: (err) => {
        console.error('Error cargando bodegas', err);
      }
    });
  }

  private seleccionarBodegaLogica(): void {
    const obj = this.input_objeto();
    const idBodegaObjeto = obj?.[this.campo()];

    // CASO: Edición o Vista (Esperamos a que el objeto tenga un ID real)
    if ((this.editMode() || this.opcionview()) && idBodegaObjeto) {
      const encontrada = this.list_bodegas.find(b => b.id === idBodegaObjeto);
      if (encontrada) {
        this.SelecBodegaControl.setValue(encontrada, { emitEvent: false });
      }
    }
    // CASO: Nuevo (Si no hay selección previa, poner la primera)
    else if (!this.editMode() && !this.opcionview() && this.list_bodegas.length > 0) {
      if (!this.SelecBodegaControl.value) { // Solo si no se ha seleccionado nada
        this.SelecBodegaControl.setValue(this.list_bodegas[0]);
        this.bodegaSeleccionada.emit(this.list_bodegas[0]);
      }
    }
  }

  onSelectionChange(event: MatSelectChange) {
    // Emitimos el valor hacia el padre
    this.bodegaSeleccionada.emit(event.value);
  }

}
