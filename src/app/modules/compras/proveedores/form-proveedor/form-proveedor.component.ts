import { Component } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModalPersonaComponent } from '../modal-persona/modal-persona.component';
import { PersonaSearch } from '../../../../core/interfaces/Compras/PersonaSearch';
import { debounceTime, finalize, Observable, of, switchMap, tap } from 'rxjs';
import { ProveedorService } from '../../../../core/services/Compras/proveedor.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Persona } from '../../../../core/models/Compras/Personas';
import { Proveedores } from '../../../../core/models/Compras/Proveedores';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';

@Component({
  selector: 'app-form-proveedor',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatDialogModule, MatAutocompleteModule, MatDatepickerModule, MatCheckboxModule],
  templateUrl: './form-proveedor.component.html',
  styleUrl: './form-proveedor.component.scss'
})
export class FormProveedorComponent {

  formulario!: FormGroup;
  objeto_resultado!: Persona;
  objeto!: Proveedores;
  isEditMode: boolean = false;


  //Autocompletar para el articulo
  // 1. Control para el campo de entrada
  searchControl = new FormControl();

  // 2. Observable que contendrá los resultados del backend
  filteredArticulos!: Observable<PersonaSearch[]>;

  isLoading = false;
  isPersonSelected = false;


  constructor(private fb: FormBuilder,
    private proveedorService: ProveedorService,
    private logAuditoria: AuditoriaService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog) {
    this.objeto = new Proveedores();
  }

  ngOnInit() {

    this.formulario = this.fb.group({
      isPersona: [false],
      id: [this.objeto.id],
      persona: this.objeto_resultado,
      codigoTitular: [this.objeto.codigoTitular, Validators.required],
      razonSocial: [this.objeto.razonSocial, Validators.required],
      regimen: [this.objeto.regimen, Validators.required],
      activo: [this.objeto.activo],
      observacion: [this.objeto.observacion], //this.objeto.fechaMovimiento
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


    this.filteredArticulos = this.searchControl.valueChanges.pipe(

      // 3. Aplica debounce: espera 400ms después de la última pulsación para iniciar la búsqueda
      debounceTime(400),

      // 4. Tap para indicar que la carga ha iniciado
      tap(() => this.isLoading = true),

      // 5. switchMap cancela la búsqueda anterior si hay una nueva (importante para evitar respuestas desordenadas)
      switchMap(value => {
        console.log("entro a buscar articulo");
        console.log(value.codigo);

        if (value === null || value === undefined) {
          console.log("Valor Nulo/Reset detectado");
          this.isLoading = false;
          return new Observable<any[]>(); // Retorna Observable vacío
        }
        let query: string;

        if (typeof value === 'object' && value !== null) {
          // El valor es un objeto (porque se seleccionó o se está mostrando el objeto)
          // Asegúrate de que .codigo existe y conviértelo a string
          query = String(value.codigo ?? '');
        } else {
          // El valor es una cadena (escritura) o un número
          query = String(value);
        }

        // 3. Validar la longitud de la query
        if (query && query.length > 2 && this.isPersonSelected === false) {
          console.log("Entró a buscar artículo con query:", query);

          // Llama al servicio para buscar en el backend
          return this.proveedorService.Search(query).pipe(
            // 4. Mantiene la funcionalidad de limpieza después de la respuesta
            finalize(() => this.isLoading = false)
          );
        } else {
          console.log("Búsqueda cancelada (longitud < 3):", query);
          console.log(this.isPersonSelected);
          this.isLoading = false;
          return new Observable<any[]>();
        }
      })
    );
  }

  // 7. Maneja la selección del artículo
  onPersonaSelected(event: any) {
    console.log("onPersonaSelected");
    //const personaSeleccionado: PersonaSearch = event.option.value;

    // 2. Bloquea el input (ESTA ES LA CLAVE DE LA SOLUCIÓN)
    this.searchControl.disable();

    // 3. Actualiza el estado para la interfaz (botones)
    this.isPersonSelected = true;

    // Lógica clave: Aquí se llama al stock disponible para decidir
    // si se auto-agrega o si se muestra el formulario de Lote/Ubicación
    // (Lógica detallada en la respuesta anterior)
    //this.iniciarProcesoDeConfiguracion(articuloSeleccionado.idArticulo!);
  }

  desvincularPersona(): void {
    //this.filteredArticulos = new Observable<any[]>();
    // 1. Limpia el valor del campo de búsqueda
    this.searchControl.setValue('');

    // 2. Habilita el input para que pueda buscar de nuevo
    this.searchControl.enable();

    // 3. Limpia la ID del proveedor
    //this.formulario.get('personaId').setValue(null);

    // 4. Actualiza el estado para la interfaz (botones)
    this.isPersonSelected = false;

    //
    this.objeto_resultado = new Persona();
    this.formulario.get('codigoTitular')?.patchValue(this.objeto_resultado.codigoTitular);
    this.formulario.get('razonSocial')?.patchValue(this.objeto_resultado.nombreCompleto);
  }

  mascaraSalida(persona: PersonaSearch): string {
    console.log("mascara salida");
    console.log(persona);
    if (persona) {
      console.log("mascara sali FINAL");
      // Devuelve el código y el nombre para una mejor referencia visual
      return `${persona.nombreCompleto} - ${persona.codTit}`;
    }
    return ''; // Devuelve cadena vacía si no hay objeto (ej: cuando el input está vacío)
  }


  ModalcrearNuevaPersona(): void {
    // 1. Abre el diálogo, pasando el componente modal y los datos
    this.searchControl.setValue('');
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

        const personaParaAutocompletar: PersonaSearch = {
          idPersona: 0, // O el campo de ID correcto
          codTit: this.objeto_resultado.codigoTitular,
          nombreCompleto: this.objeto_resultado.nombreCompleto
        };

        this.searchControl.setValue(personaParaAutocompletar);
        this.onPersonaSelected({ option: { value: personaParaAutocompletar } }); // Simular la selección
      }
    });

    console.log("fin modal");
    console.log(this.objeto_resultado);
  }

  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario");
    const estadoBodegaPrincipal = this.formulario.get('bodegaPrincipal')?.value;
    const estadoUbucaciones = this.formulario.get('manejaUbicaciones')?.value;
    const estadoActivo = this.formulario.get('activo')?.value;
    console.log(estadoBodegaPrincipal);
    this.formulario.patchValue({
      fechaMod: new Date().toISOString(),
      activo: estadoActivo ? 'S' : 'N',
      persona: this.objeto_resultado
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
      this.proveedorService.save(this.formulario.value).subscribe({
        next: (ObjectSave) => {
          // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
          console.log(ObjectSave);
          // 4. Redirigir a la vista de lista principal.
          this.router.navigate(['/proveedores']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
        }
      });
    }

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


}
