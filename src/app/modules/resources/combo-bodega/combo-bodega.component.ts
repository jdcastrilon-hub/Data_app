import { Component, input, output } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Bodega } from '../../../core/models/Bodega/Bodega';
import { BodegaService } from '../../../core/services/Bodega/bodega.service';

@Component({
  selector: 'combo-bodega',
  imports: [MatInputModule, MatSelectModule, FormsModule, ReactiveFormsModule],
  templateUrl: './combo-bodega.component.html',
  styleUrl: './combo-bodega.component.scss'
})
export class ComboBodegaComponent {

  //Parametros de entrada
  input_objeto = input<any>(null);
  editMode = input<boolean>(false);

  //salidas
  bodegaSeleccionada = output<Bodega>();

  //Bodegas
  list_bodegas: Bodega[] = [];
  SelecBodegaControl = new FormControl<Bodega | null>(null, Validators.required);

  constructor(private fb: FormBuilder,
    private bodegaService: BodegaService
  ) { }

  ngOnInit(): void {
    console.log("Modelo Bodega");
    console.log(this.editMode());
    console.log(this.input_objeto());
    this.cargaDatos();
  }

  cargaDatos(): void {
    console.log("Componente combo cargarBodegas");
    this.bodegaService.list().subscribe({
      next: (data) => {
        //Se recupera el Json del API
        this.list_bodegas = data;
        //Si esta en modo edicion 
        if (this.editMode()!) {
          console.log("Modelo edicion bodega");
          console.log(this.input_objeto());
          //busco ajuste por ID
          const bodegaSeleccionada = this.list_bodegas.find(
            obj => obj.id === this.input_objeto().idBodega!
          );

          if (bodegaSeleccionada) {
            console.log("Carga bodega");
            console.log(bodegaSeleccionada);
            //Se asigna Categoria
            this.SelecBodegaControl.setValue(bodegaSeleccionada);
            this.bodegaSeleccionada.emit(bodegaSeleccionada);
          }
        } else {
          console.log("Modelo nuevo bodega");
          //Modo nuevo
          const unicoBodega = this.list_bodegas[0];
          this.SelecBodegaControl.setValue(unicoBodega);
          this.bodegaSeleccionada.emit(unicoBodega);
        }
      },
      error: (err) => {
        console.error('Error cargando bodegas', err);
      }
    });
  }

  onSelectionChange(event: MatSelectChange) {
    // Emitimos el valor hacia el padre
    this.bodegaSeleccionada.emit(event.value);
  }

}
