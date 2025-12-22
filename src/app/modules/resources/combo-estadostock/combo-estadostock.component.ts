import { Component, input, output } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { EstadoStock } from '../../../core/models/Bodega/EstadoStock';
import { EstadosService } from '../../../core/services/Bodega/estados.service';

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

  //salidas
  estadoSeleccionado = output<EstadoStock>();

  //Estados de Stock
  list_estados: EstadoStock[] = [];
  SelecEstadoControl = new FormControl<EstadoStock | null>(null, Validators.required);


  constructor(private fb: FormBuilder,
    private estadoService: EstadosService
  ) { }

  ngOnInit(): void {
    console.log(this.editMode());
    this.cargaDatos();
  }

  cargaDatos(): void {
    console.log("Componente combo estados stock");
    this.estadoService.list().subscribe({
      next: (data) => {
        //Se recupera el Json del API
        this.list_estados = data;
        //Si esta en modo edicion 
        if (this.editMode()!) {
          console.log("Modelo edicion");
          console.log(this.input_objeto());
          //busco ajuste por ID
          const estadoSeleccionado = this.list_estados.find(
            obj => obj.id === this.input_objeto().idEstado!
          );

          if (estadoSeleccionado) {
            console.log("Carga Estado");
            console.log(estadoSeleccionado);
            //Se asigna Categoria
            this.SelecEstadoControl.setValue(estadoSeleccionado);
            this.estadoSeleccionado.emit(estadoSeleccionado);
          }
        } else {
          //Modo nuevo
          const primerEstado = this.list_estados[0];
          this.SelecEstadoControl.setValue(primerEstado);
          this.estadoSeleccionado.emit(primerEstado);
        }
      },
      error: (err) => {
        console.error('Error cargando Estados', err);
      }
    });
  }



  onSelectionChange(event: MatSelectChange) {
    // Emitimos el valor hacia el padre
    this.estadoSeleccionado.emit(event.value);
  }


}
