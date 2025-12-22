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
  //Sucursal
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
      idSucusal : [this.objeto.idSucusal, Validators.required],
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
    this.sucursalService.list().subscribe({
      next: (data) => {
        this.list_sucursal = data;

        // Si es metodo edicion y tengo una empresa cargada.
        //La busco en la lista que me retorno el API
        if (this.isEditMode && this.objeto.idSucusal) {
          //busco la sucursal por ID
          const sucursalSeleccinada = this.list_sucursal.find(
            sucursal => sucursal.id === this.objeto.idSucusal
          );

          if (sucursalSeleccinada) {
            // [CLAVE]: Asigna el OBJETO completo al FormControl
            this.SelectSucursalControl.setValue(sucursalSeleccinada);
          }
        } else if (!this.isEditMode) {
          // Condición: Si estamos en modo Nuevo (this.isEditMode es false)
          // Y la lista de empresas tiene exactamente 1 elemento.
          if (this.list_sucursal.length === 1) {
            const unicaSucursal = this.list_sucursal[0];
            this.SelectSucursalControl.setValue(unicaSucursal);
          }
        }
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario");
    const estadoBodegaPrincipal = this.formulario.get('bodegaPrincipal')?.value;
    const estadoUbucaciones = this.formulario.get('manejaUbicaciones')?.value;
    const estadoActivo = this.formulario.get('activo')?.value;
    console.log(estadoBodegaPrincipal);
    this.formulario.patchValue({
      idSucusal: this.SelectSucursalControl.value?.id,
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
    console.log("OBJECTO");
    console.log(this.formulario.getRawValue());


    if (this.isEditMode) {
      //Evento Edicion
      console.log("api ediccion");
    } else {
      //Evento nuevo
      this.bodegaService.save(this.formulario.value).subscribe({
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
