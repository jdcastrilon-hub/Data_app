import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TipoDocumento } from '../../../../core/models/Compras/TipoDocumento';
import { TipoDocumentoService } from '../../../../core/services/Compras/tipo-documento.service';
import { Ciudades } from '../../../../core/models/core/Ciudades';
import { ProveedorService } from '../../../../core/services/Compras/proveedor.service';
import { Persona } from '../../../../core/models/Compras/Personas';
//import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogData {
  titulo: string;
  mensaje: string;
}

@Component({
  selector: 'modal-persona',
  imports: [MatDialogModule, modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    MatAutocompleteModule, MatDatepickerModule],
  templateUrl: './modal-persona.component.html',
  styleUrl: './modal-persona.component.scss'
})
export class ModalPersonaComponent {

  //Variables Generales
  formulario!: FormGroup;
  objeto!: Persona;
  isEditMode: boolean = false;


  //Tipo Documentos
  defaultTipoDoc = { id: 1, codigoTipoDocumento: 'CC', nombreTipoDocumento: 'CC' }; //Valor por defecto
  list_tipos: TipoDocumento[] = [];
  SelecTiposControl = new FormControl<TipoDocumento | null>(this.defaultTipoDoc, Validators.required);

  //Tipos de sexo
  defaultSexo = 'M'; //Valor por defecto
  list_sexos: String[] = ['M', 'F'];
  SelecSexoControl = new FormControl<String | null>(this.defaultSexo, Validators.required);

  //Ciudades
  defaultCiudad = { idCiudad: 3, codCiudad: '76001', nomCiudad: 'CALI' }; //Valor por defecto
  list_ciudades: Ciudades[] = [];
  SelecCiudadControl = new FormControl<Ciudades | null>(this.defaultCiudad, Validators.required);


  // 1. Recibe la referencia del modal y los datos inyectados
  constructor(
    private fb: FormBuilder,
    private tipoService: TipoDocumentoService,
    private proveedorService: ProveedorService,
    public dialogRef: MatDialogRef<ModalPersonaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { this.objeto = new Persona(); }

  ngOnInit(): void {
    console.log(this.objeto);

    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      idPersona: [this.objeto.idPersona],
      idTipoDoc: [this.objeto.idTipoDoc, Validators.required],
      codigoTitular: [this.objeto.codigoTitular, Validators.required],
      nombres: [this.objeto.nombres, Validators.required],
      apellidos: [this.objeto.apellidos, Validators.required],
      sexo: this.objeto.sexo,
      direccion: this.objeto.direccion,
      telefono: this.objeto.telefono,
      email: this.objeto.email,
      idCiudad: this.objeto.fechaMod,
      fechaNacimiento: [new Date(), Validators.required], //this.objeto.fechaMovimiento
      fechaMod: this.objeto.fechaMod,
      nombreCompleto: this.objeto.nombreCompleto
    });


    this.CargaTiposDocumento();

    this.CargaCiudades();

    console.log(this.list_sexos);
  }

  //Metodo para cargar lista de bodegas.
  CargaTiposDocumento(): void {
    console.log("CargaTiposDocumento");
    this.tipoService.list().subscribe({
      next: (data) => {
        this.list_tipos = data;

        //Si esta en modo edicion 
        if (this.isEditMode) {
          console.log("Modelo edicion");

        } else {
          //Modo nuevo
          const unicoDocumento = this.list_tipos[0];
          this.SelecTiposControl.setValue(unicoDocumento);
          this.formulario.get('idTipoDoc')?.patchValue(unicoDocumento.id);
        }


      },
      error: (err) => {
        console.error('Error cargando bodegas', err);
      }
    });
  }

  //List Ciudades
  CargaCiudades(): void {
    console.log("Carga Ciudades");
    this.proveedorService.ciudades().subscribe({
      next: (data) => {
        this.list_ciudades = data;

        //Si esta en modo edicion 
        if (this.isEditMode) {
          console.log("Modelo edicion");

        } else {
          //Modo nuevo
          const unicoDocumento = this.list_ciudades[0];
          this.SelecCiudadControl.setValue(unicoDocumento);
        }


      },
      error: (err) => {
        console.error('Error cargando bodegas', err);
      }
    });
  }

  // 2. Método para cerrar el modal enviando un resultado específico
  cerrarConResultado(): void {
    this.dialogRef.close('Resultado Confirmado');
  }

  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario");

    this.formulario.patchValue({
      idTipoDoc: this.SelecTiposControl.value?.id,
      sexo: this.SelecSexoControl.value,
      idCiudad: this.SelecCiudadControl.value?.idCiudad,
      nombreCompleto: this.formulario.get('nombres')?.value + ' ' + this.formulario.get('apellidos')?.value,
      fechaMod: new Date().toISOString()
    });
    console.log(this.formulario.value);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    this.dialogRef.close(this.formulario.getRawValue());

  }

}
