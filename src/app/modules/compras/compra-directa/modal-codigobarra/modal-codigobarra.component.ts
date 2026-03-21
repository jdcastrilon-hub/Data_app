import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { registroarticuloCompra } from 'src/app/core/interfaces/Compras/registroarticuloCompra';
import { ArticuloSearch } from 'src/app/core/models/Bodega/ArticuloSearch';
import { CodigosBarra } from 'src/app/core/models/Bodega/CodigosBarra';
import { ArticuloServiceService } from 'src/app/core/services/Bodega/articulo-service.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { ComboArticuloComponent } from 'src/app/modules/resources/combo-articulo/combo-articulo.component';

export interface DialogData {
  titulo: string;
  mensaje: string;
}

@Component({
  selector: 'modal-codigobarra',
  imports: [MatDialogModule, modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, ComboArticuloComponent],
  templateUrl: './modal-codigobarra.component.html',
  styleUrl: './modal-codigobarra.component.scss'
})
export class ModalCodigobarraComponent {

  //Variables Generales
  formulario!: FormGroup;
  objeto!: CodigosBarra;
  objeto_search !: ArticuloSearch;
  objecto_validacion !: registroarticuloCompra;
  isEditMode: boolean = false;


  // 1. Recibe la referencia del modal y los datos inyectados
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalCodigobarraComponent>,
    private articuloService: ArticuloServiceService,
    private notificacion: NotificacionesService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.objeto = new CodigosBarra();
    this.objeto_search = new ArticuloSearch()
  }

  ngOnInit(): void {
    console.log(this.objeto);

    //Se instancias las variables para el formulario

    this.formulario = this.fb.group({
      id: [this.objeto.id],
      id_articulo: [this.objeto.id_articulo, Validators.required],
      codBarra: [this.objeto.codBarra, Validators.required],
      nomBarra: [this.objeto.nomBarra, Validators.required],
      searchArticulo: [this.objeto_search]
    });

  }

  recibirArticulo(articulo: any) {
    console.log('El padre recibió la bodega:', articulo);
    this.formulario.patchValue({
      id_articulo: articulo.idArticulo,
      searchArticulo: articulo
    });
  }


  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario");

    console.log(this.formulario.value);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    const id_articulo = this.formulario.value.id_articulo;
    const codigo_barra = this.formulario.value.codBarra;
    console.log(id_articulo)
    console.log(codigo_barra)
    this.articuloService.SearchByCodigoBarra(id_articulo, codigo_barra).subscribe({
      next: (objecto) => {
        this.objecto_validacion = objecto;

        if (this.objecto_validacion.existe) {
          console.log("No puedes usar este código, ya existe.");
          this.notificacion.showError('No puedes usar este código, ya existe');
          // Aquí puedes disparar una alerta o marcar el campo en rojo
        } else {
          console.log("Código disponible.");
          //asignamos el valor de idBarra
          this.formulario.patchValue({
            id: this.objecto_validacion.idCodBarra
          });
          console.log(this.formulario.getRawValue())
          this.dialogRef.close(this.formulario.getRawValue());
        }
      },
      error: (err) => console.error("Error al validar código", err)
    });



  }


}
