import { Component } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CajaCombo } from 'src/app/core/interfaces/Comercial/CajaCombo';
import { SucursalXCajas } from 'src/app/core/interfaces/Comercial/SucursalXCajas';
import { Sucursal } from 'src/app/core/models/General/Sucursal';
import { Turnos } from 'src/app/core/models/Ventas/Turnos';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { SucursalServiceService } from 'src/app/core/services/General/sucursal-service.service';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';

@Component({
  selector: 'app-form-turnos',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatCheckboxModule,MatDatepickerModule],
  templateUrl: './form-turnos.component.html',
  styleUrl: './form-turnos.component.scss'
})
export class FormTurnosComponent {

  formulario!: FormGroup;
  objeto!: Turnos;
  titulo_form !: string;

  //parametros de entrada  
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  //Seleccion para sucursales.
  list_sucursal: SucursalXCajas[] = [];
  SelectSucursalControl = new FormControl<SucursalXCajas | null>(null, Validators.required);

  //Seleccion para caja.
  list_caja: CajaCombo[] = [];
  SelectCajaControl = new FormControl<CajaCombo | null>(null, Validators.required);

  //constructor
  constructor(
    private fb: FormBuilder,
    private sucursalService: SucursalServiceService,
    private logAuditoria: AuditoriaService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.objeto = new Turnos();
  }

  ngOnInit(): void {
    console.log("form turno")
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      id: [this.objeto.id, Validators.required],
      idCaja: [this.objeto.idCaja, Validators.required],
      Fecha: [new Date(), Validators.required],
      status: [this.objeto.status],
      impBase: [this.objeto.impBase],
      usuario: [this.objeto.usuario],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([])
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.disable(); // Esto bloquea todos los inputs, selects y checks
      this.SelectSucursalControl.disable();
    }
    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        console.log("Edicion")
        this.isEditMode = true;
        if (this.isReadOnly) {
          this.titulo_form = "DETALLE BODEGA"
        } else {
          this.titulo_form = "ACTUALIZACION BODEGA"
        }

        this.ModoEdicion(Number(id)); // Llama al método de carga

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        console.log("Nuevo")
        this.isEditMode = false;
        this.titulo_form = "ABRIR TURNO"
        this.objeto = new Turnos();
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
    this.sucursalService.sucursalesxCaja().subscribe({
      next: (data) => {
        this.list_sucursal = data;

        // Si es metodo edicion y tengo una empresa cargada.
        //La busco en la lista que me retorno el API
        if (this.isEditMode) {
        } else {
          // se carga la primer sucursal por defecto
          const unicoregistro = this.list_sucursal[0];
          if (unicoregistro) {
            this.SelectSucursalControl.setValue(unicoregistro);
            this.list_caja = unicoregistro.cajas!;

            const unicacaja = this.list_caja[0];
            if (unicacaja) {
              this.SelectCajaControl.setValue(unicacaja);
            }
          }

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

