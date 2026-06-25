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
import { MatDividerModule } from '@angular/material/divider';
import { UltimaCaja } from 'src/app/core/interfaces/Comercial/UltimaCaja';
import { ServiciosiniService } from 'src/app/core/services/core/serviciosini.service';
import { Numerador } from 'src/app/core/models/core/Numerador';
import { AbrirturnoService } from 'src/app/core/services/Ventas/abrirturno.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';

@Component({
  selector: 'app-form-turnos',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatCheckboxModule, MatDatepickerModule, MatDividerModule],
  templateUrl: './form-turnos.component.html',
  styleUrl: './form-turnos.component.scss'
})
export class FormTurnosComponent {

  formulario!: FormGroup;
  objeto!: Turnos;
  titulo_form !: string;
  ultima_caja!: UltimaCaja;

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
    private turnoService: AbrirturnoService,
    private logAuditoria: AuditoriaService,
    private serviceIni: ServiciosiniService,
    private notificacion: NotificacionesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.objeto = new Turnos();
  }

  ngOnInit(): void {
    console.log("form turno")
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      id: [{ value: this.objeto.id, disabled: true }, Validators.required],
      idCaja: [this.objeto.idCaja, Validators.required],
      Fecha: [new Date(), Validators.required],
      status: [this.objeto.status],
      impBase: [this.objeto.impBase, Validators.required],
      usuario: [this.objeto.usuario],
      observacion: [this.objeto.Observacion],
      idCaja_ref: [this.objeto.idCaja_ref],
      Fecha_ref: [this.objeto.Fecha_ref],
      status_ref: [this.objeto.status_ref],
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
        //Carga sucursales
        this.cargarSucursales();
        this.obtenerNumerador("t_abrirturno_id_seq");
        this.cargarUltimaCaja();
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
  //Metodo para cargar lista de sucursales.
  cargarUltimaCaja(): void {
    this.turnoService.cargarUltimaCaja("jcastrilon").subscribe({
      next: (data) => {
        //actualizar path
        if (data.idturno != 0) {
          this.formulario.get('idCaja_ref')?.patchValue(data.idturno);
          this.formulario.get('Fecha_ref')?.patchValue(data.fecha);
          this.formulario.get('status_ref')?.patchValue(data.estado);
        }

      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  /**
  * Metodo para obtener el numerador siguiente de (nroDocum)
  *
  * @param numerador Numerador de la base de datos.
  * @returns No tiene return , carga directamente en el patchValue de 'nroDocum'
  */
  obtenerNumerador(numerador: string): void {
    console.log("obtenerNumerador");
    console.log(numerador)
    this.serviceIni.numeradorNext(numerador).subscribe({
      next: (data: Numerador) => {
        this.formulario.get('id')?.patchValue(data.next_value);
      },
      error: (err) => {
        console.error('Error (obtenerNumerador)', err);
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
    this.formulario.patchValue({
      idCaja: this.SelectCajaControl.value?.idCaja,
      fechaMod: new Date().toISOString(),
      usuario: 'jcastrilon',
      status: this.formulario.get('status')?.value ?? true,
      observacion: this.formulario.get('observacion')?.value || ''
    });

    console.log("OBJECTO");
    console.log(this.formulario.getRawValue());

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Auditoria
    this.agregarLogAuditoria();

    const payload = { ...this.formulario.getRawValue() };

    // Eliminamos los campos específicos
    delete payload.idCaja_ref;
    delete payload.Fecha_ref;
    delete payload.status_ref;
    console.log('JSON Limpio:', payload);


    //Evento nuevo
    if (this.isEditMode) {
      console.log("Editar")

    } else {
      console.log("Nuevo")

      this.turnoService.save(payload).subscribe({
        next: (turno) => {
          // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
          console.log(turno);
          this.notificacion.showSuccess('Turno Abierto con éxito!');
          this.resetCampos();
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

  resetCampos() {
    //Recuperar valores que no cambian
    const idCaja = this.formulario.value.idCaja;
    const feccjaCaja = this.formulario.value.fecha;


    //Limpiar el formulario
    this.objeto = new Turnos();
    //reset grilla de logs
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    //reset grilla de articulos
    
    //actualizo referencias
    this.formulario.get('idCaja_ref')?.patchValue(idCaja);
    this.formulario.get('Fecha_ref')?.patchValue(feccjaCaja);
    this.formulario.get('status_ref')?.patchValue("Abierta");

  }


}

