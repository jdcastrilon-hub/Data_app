import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Bodega } from '../../../../core/models/Bodega/Bodega';
import { Sucursal } from '../../../../core/models/General/Sucursal';
import { BodegaService } from '../../../../core/services/Bodega/bodega.service';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { SucursalServiceService } from '../../../../core/services/General/sucursal-service.service';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'form-bodega',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatCheckboxModule],
  templateUrl: './form-bodega.component.html',
  styleUrl: './form-bodega.component.scss'
})
export class FormBodegaComponent {
  formulario!: FormGroup;

  //parametros de entrada
  objeto!: Bodega;
  isEditMode: boolean = false;

  //Seleccion para sucursales.
  list_sucursal: Sucursal[] = [];
  SelectSucursalControl = new FormControl<Sucursal | null>(null, Validators.required);

  //constructor
  constructor(
    private fb: FormBuilder,
    private bodegaService: BodegaService,
    private sucursalService: SucursalServiceService,
    private logAuditoria: AuditoriaService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.objeto = new Bodega();
  }

  ngOnInit(): void {
    console.log("form Bodega")
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      codBodega: [this.objeto.codBodega, Validators.required],
      nomBodega: [this.objeto.nomBodega, Validators.required],
      bodegaPrincipal: [this.objeto.bodegaPrincipal, Validators.required],
      manejaUbicaciones: [this.objeto.manejaUbicaciones],
      activo: [this.objeto.activo],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
      id: [this.objeto.id],
      idSucursal: [this.objeto.idSucursal, Validators.required],
    });

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        console.log("Edicion")
        this.isEditMode = true;
        this.ModoEdicion(Number(id)); // Llama al método de carga

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        console.log("Nuevo")
        this.isEditMode = false;
        this.objeto = new Bodega();
        this.formulario.get('bodegaPrincipal')?.patchValue(false);
        this.formulario.get('manejaUbicaciones')?.patchValue(false);
        this.formulario.get('activo')?.patchValue(false);
        //Carga sucursales
        this.cargarSucursales();
      }
    });
  }

  //Metodo para cargar lista de sucursales.
  cargarSucursales(): void {
    this.sucursalService.listCombo().subscribe({
      next: (data) => {
        this.list_sucursal = data;

        // Si es metodo edicion y tengo una empresa cargada.
        //La busco en la lista que me retorno el API
        if (this.isEditMode) {
          //busco la sucursal por ID
          const sucursalSeleccinada = this.list_sucursal.find(
            sucursal => sucursal.id === this.objeto.idSucursal
          );

          if (sucursalSeleccinada) {
            // [CLAVE]: Asigna el OBJETO completo al FormControl
            this.SelectSucursalControl.setValue(sucursalSeleccinada);
          }
        } else {
          // Condición: Si estamos en modo Nuevo (this.isEditMode es false)
            const unicoregistro = this.list_sucursal[0];
            this.SelectSucursalControl.setValue(unicoregistro);
        }
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  /**
  * Metodo para cargar la informacion de la bodega por el (id)
  * @returns No tiene return
  */
  ModoEdicion(id: number): void {
    console.log("ModoEdicion");
    //llama el API para recuperar el objecto categoria
    this.bodegaService.getBodegaById(id).subscribe(
      (data: Bodega) => {
        console.log("Respuesta API");
        console.log(data);
        this.objeto = data; // Cargar la data de la categoría en el formulario
        this.formulario.get('id')?.patchValue(data.id);
        this.formulario.get('codBodega')?.patchValue(data.codBodega);
        this.formulario.get('nomBodega')?.patchValue(data.nomBodega);
        this.formulario.get('bodegaPrincipal')?.patchValue(data.bodegaPrincipal === 'S');
        this.formulario.get('manejaUbicaciones')?.patchValue(data.manejaUbicaciones === 'S');
        this.formulario.get('activo')?.patchValue(data.activo === 'S');

        this.cargarSucursales();

      },
      error => {
        console.error('Error al cargar la categoría:', error);
        // Opcional: Redirigir si el ID es inválido o no existe
        this.router.navigate(['/categorias']);
      }
    );
  }

  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario");
    const estadoBodegaPrincipal = this.formulario.get('bodegaPrincipal')?.value;
    const estadoUbucaciones = this.formulario.get('manejaUbicaciones')?.value;
    const estadoActivo = this.formulario.get('activo')?.value;
    console.log(estadoBodegaPrincipal);
    this.formulario.patchValue({
      idSucursal: this.SelectSucursalControl.value?.id,
      fechaMod: new Date().toISOString(),
      bodegaPrincipal: estadoBodegaPrincipal ? 'S' : 'N',
      manejaUbicaciones: estadoUbucaciones ? 'S' : 'N',
      activo: estadoActivo ? 'S' : 'N',
    });

    console.log("OBJECTO");
    console.log(this.formulario.getRawValue());

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Auditoria
    this.agregarLogAuditoria();
    console.log("OBJECTO2");
    console.log(this.formulario.getRawValue());


    if (this.isEditMode) {
      //Evento Edicion
      console.log("api ediccion");
      console.log(this.objeto.id)
      
      this.bodegaService.edit(this.formulario.getRawValue(),this.objeto.id!).subscribe({
        next: (ObjectSave) => {
          // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
          console.log(ObjectSave);
          // 4. Redirigir a la vista de lista principal.
          this.router.navigate(['/bodegas']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
        }
      });
      
    } else {
      //Evento nuevo
      const dataCompleta = this.formulario.getRawValue();
      const { id, ...bodyJson } = dataCompleta;
      console.log('JSON Limpio:', bodyJson);
      console.log("api nuevo");
      this.bodegaService.save(bodyJson).subscribe({
        next: (ObjectSave) => {
          // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
          console.log(ObjectSave);
          // 4. Redirigir a la vista de lista principal.
          this.router.navigate(['/bodegas/new']);
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
