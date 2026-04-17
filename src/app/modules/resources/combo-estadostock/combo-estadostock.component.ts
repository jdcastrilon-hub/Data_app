import { Component, effect, input, output } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { EstadosService } from '../../../core/services/Bodega/estados.service';
import { EstadoCombo } from 'src/app/core/interfaces/Bodega/EstadoCombo';

@Component({
  selector: 'combo-estadostock',
  imports: [MatInputModule, MatSelectModule, FormsModule, ReactiveFormsModule],
  templateUrl: './combo-estadostock.component.html',
  styleUrl: './combo-estadostock.component.scss'
})
export class ComboEstadostockComponent {


  //Parametros de entrada
  input_objeto = input<any>(null);
  editMode = input<boolean>(false);
  opcionview = input<boolean>(false);

  //salidas
  estadoSeleccionado = output<EstadoCombo>();

  //Estados de Stock
  list_estados: EstadoCombo[] = [];
  SelecEstadoControl = new FormControl<EstadoCombo | null>(null, Validators.required);


  constructor(private fb: FormBuilder,
    private estadoService: EstadosService
  ) {
    effect(() => {
      const objeto = this.input_objeto();
      const esLectura = this.opcionview();

      // 1. Manejar el estado habilitado/deshabilitado
      if (esLectura) {
        this.SelecEstadoControl.disable({ emitEvent: false });
      } else {
        this.SelecEstadoControl.enable({ emitEvent: false });
      }

      // 2. Si el objeto cambió y ya tenemos bodegas cargadas, intentar seleccionar
      if (this.list_estados.length > 0) {
        this.seleccionarEstadoLogica();
      }
    });
  }

ngOnInit(): void {
  this.cargaDatos();
}

cargaDatos(): void {
  console.log("Componente combo estados stock");
  this.estadoService.listSelection().subscribe({
    next: (data) => {
      //Se recupera el Json del API
      this.list_estados = data;
      this.seleccionarEstadoLogica();
    },
    error: (err) => {
      console.error('Error cargando Estados', err);
    }
  });
}

  private seleccionarEstadoLogica(): void {
  const obj = this.input_objeto();

  // CASO: Edición o Vista (Esperamos a que el objeto tenga un ID real)
  if((this.editMode() || this.opcionview()) && obj?.idBodega) {
  const encontrada = this.list_estados.find(b => b.id === obj.idBodega);
  if (encontrada) {
    this.SelecEstadoControl.setValue(encontrada, { emitEvent: false });
  }
}
    // CASO: Nuevo (Si no hay selección previa, poner la primera)
    else if (!this.editMode() && !this.opcionview() && this.list_estados.length > 0) {
  if (!this.SelecEstadoControl.value) { // Solo si no se ha seleccionado nada
    this.SelecEstadoControl.setValue(this.list_estados[0]);
    this.estadoSeleccionado.emit(this.list_estados[0]);
  }
}
  }


onSelectionChange(event: MatSelectChange) {
  // Emitimos el valor hacia el padre
  this.estadoSeleccionado.emit(event.value);
}


}
