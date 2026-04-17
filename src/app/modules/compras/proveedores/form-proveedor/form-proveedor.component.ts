import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModalPersonaComponent } from '../modal-persona/modal-persona.component';
import { PersonaSearch } from '../../../../core/interfaces/Compras/PersonaSearch';
import { ProveedorService } from '../../../../core/services/Compras/proveedor.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Persona } from '../../../../core/models/Compras/Personas';
import { Proveedores } from '../../../../core/models/Compras/Proveedores';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ComboPersonaComponent } from 'src/app/modules/resources/combo-persona/combo-persona.component';

@Component({
  selector: 'app-form-proveedor',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatDialogModule, MatAutocompleteModule, MatDatepickerModule, MatCheckboxModule, ComboPersonaComponent],
  templateUrl: './form-proveedor.component.html',
  styleUrl: './form-proveedor.component.scss'
})
export class FormProveedorComponent {

  formulario!: FormGroup;
  objeto_resultado!: Persona;
  objeto!: Proveedores;
  isEditMode: boolean = false;

  //isLoading = false;
  mostrarOpcionCrear = true;

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private proveedorService: ProveedorService,
    private logAuditoria: AuditoriaService,
    private route: ActivatedRoute,
    private notificacion: NotificacionesService,
    private router: Router,
    private dialog: MatDialog) {
    this.objeto = new Proveedores();
  }

  ngOnInit() {

    let persona_filtro: PersonaSearch = {
      idPersona: 0,
      codTit: '',
      nombreCompleto: ''
    }

    this.formulario = this.fb.group({
      //isPersona: [false],
      idEmp: [this.objeto.idEmp],
      idProveedor: [this.objeto.idProveedor],
      idPersona: [this.objeto.idPersona],
      persona: this.objeto_resultado,
      codigoTitular: [this.objeto.codigoTitular, Validators.required],
      razonSocial: [this.objeto.razonSocial, Validators.required],
      regimen: [this.objeto.regimen, Validators.required],
      activo: [this.objeto.activo],
      observacion: [this.objeto.observacion], //this.objeto.fechaMovimiento
      searchPersona: [persona_filtro],
      fechaMod: this.objeto.fechaMod,
      logs: this.fb.array([]),
    });

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        console.log("Edicion")

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        console.log("Nuevo")
        this.isEditMode = false;
        this.objeto = new Proveedores();
        this.formulario.get('activo')?.patchValue(false);
      }
    });
  }

  onPersonaChange(persona: PersonaSearch) {
    console.log('onPersonaChange:', persona);
    if (persona != null) {
      this.formulario.patchValue({
        idPersona: persona.idPersona,
        searchPersona: persona
      });
      this.formulario.get('searchPersona')?.disable();
    } else {
      this.formulario.get('searchPersona')?.enable();
      this.formulario.patchValue({
        idPersona: 0,
        searchPersona: persona
      });
    }


    //fila.get('search')?.disable(); //Se bloque la primera columna.
  }




  ModalcrearNuevaPersona(): void {
    // 1. Abre el diálogo, pasando el componente modal y los datos
    this.objeto_resultado = new Persona();
    //this.isPersonSelected = true;
    const dialogRef = this.dialog.open(ModalPersonaComponent, {
      width: '70%', // Define el ancho del modal
      data: {
        titulo: 'REGISTRO DE PERSONA',
        mensaje: 'Este mensaje fue enviado desde el componente principal.'
      }
    });

    // 2. Suscríbete al observable 'afterClosed()' para obtener el resultado
    dialogRef.afterClosed().subscribe(result => {
      console.log('El modal se cerró con el resultado:', result);

      // 'result' contendrá 'Resultado Confirmado' o 'undefined' (si se cerró con 'Cancelar')
      //this.resultadoModal = result || 'Cancelado por el usuario o cerrado por ESC';
      this.objeto_resultado = result;


      if (this.objeto_resultado) {

        this.formulario.get('codigoTitular')?.patchValue(this.objeto_resultado.codigoTitular);
        this.formulario.get('razonSocial')?.patchValue(this.objeto_resultado.nombreCompleto);

        //Capturamos el evento de la linea


        const personaParaAutocompletar: PersonaSearch = {
          idPersona: 0, // O el campo de ID correcto
          codTit: this.objeto_resultado.codigoTitular,
          nombreCompleto: this.objeto_resultado.nombreCompleto
        };
        this.mostrarOpcionCrear = false;
        this.onPersonaChange(personaParaAutocompletar); // Simular la selección
      }
    });

    console.log("fin modal");
    console.log(this.objeto_resultado);
  }


  // Método para agregar el log al FormArray
  agregarLogAuditoria() {
    // 1. Obtienes el objeto de log ya completo y formateado del servicio
    const logData = this.logAuditoria.generarLog(!this.isEditMode ? 'Nuevo' : 'Edicion');

    // 2. Creas un nuevo FormGroup usando la data
    const auditoriaGroup = this.fb.group({
      operacion: [logData.operacion],
      usuario_mod: [logData.usuario_mod],
      fecha_mod: [logData.fecha_mod]
    });

    // 3. Lo añades al FormArray
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.push(auditoriaGroup);
  }

  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario");
    const estadoActivo = this.formulario.get('activo')?.value;

    this.formulario.patchValue({
      fechaMod: new Date().toISOString(),
      activo: estadoActivo ? 'S' : 'N',
      persona: this.objeto_resultado,
      idEmp: 1
    });

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Auditoria
    this.agregarLogAuditoria();
    console.log("OBJECTO");
    console.log(this.formulario.getRawValue());


    if (this.isEditMode) {
      //Evento Edicion
      console.log("api ediccion");
    } else {
      //Evento nuevo
      console.log("api nuevo");
      const dataCompleta = this.formulario.getRawValue();
      const jsonParaAPI = {
        ...dataCompleta,
        searchPersona: undefined,
      };
      console.log(jsonParaAPI)
      this.proveedorService.save(jsonParaAPI).subscribe({
        next: (ObjectSave) => {
          this.notificacion.showSuccess('¡Proveedor guardado con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
        }
      });
    }


  }


  resetCampos() {
    //Recuperar valores que no cambian
    const idBodega = this.formulario.value.idBodega;
    const idEstado = this.formulario.value.idEstado;
    const nrodocum: number = this.formulario.get('nroDocum')?.value;

    //Limpiar el formulario
    this.objeto = new Proveedores();
    this.formDirective.resetForm();
    this.objeto_resultado = new Persona();
    //reset grilla de logs
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();

  }


}
