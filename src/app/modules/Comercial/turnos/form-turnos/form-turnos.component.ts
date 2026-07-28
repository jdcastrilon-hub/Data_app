import { Component, ElementRef, ViewChild } from '@angular/core';
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
import { AbrirturnoService } from 'src/app/core/services/Ventas/abrirturno.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { NumeradorService } from 'src/app/core/services/core/numerador.service';

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

  @ViewChild('impBaseInput') impBaseInputRef!: ElementRef<HTMLInputElement>;

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
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private numeradorService: NumeradorService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.objeto = new Turnos();
  }

  ngOnInit(): void {
    console.log("form turno")
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      // id: el numero real lo asigna el backend (numerador "TURNO" en
      // md_numeradores) recien al guardar. Aca solo se muestra un valor
      // tentativo (previsualizarNumerador) - disabled para que no sea editable,
      // mismo criterio que "Factura" en venta-directa.
      id: [{ value: this.objeto.id, disabled: true }],
      idCaja: [this.objeto.idCaja, Validators.required],
      fecha: [new Date(), Validators.required],
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
          this.titulo_form = "DETALLE TURNO"
        } else {
          this.titulo_form = "ACTUALIZACION TURNO"
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
        this.cargarUltimaCaja();
        this.previsualizarNumerador();
      }
    });
  }

  //Metodo para cargar lista de sucursales.
  cargarSucursales(): void {
    const usuario = this.loginService.getUsuarioActual()?.usuario ?? '';
    this.sucursalService.sucursalesxCaja(usuario).subscribe({
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
    const usuario = this.loginService.getUsuarioActual()?.usuario ?? '';
    this.turnoService.cargarUltimaCaja(usuario).subscribe({
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
   * Muestra el numero de turno tentativo (sin consumir el numerador real,
   * mismo mecanismo que "Factura" en venta-directa). El numero definitivo lo
   * asigna el backend recien al guardar (md_numeradores, codigo "TURNO").
   */
  previsualizarNumerador(): void {
    const idEmp = this.loginService.getIdEmpresaActual();
    if (!idEmp) {
      return;
    }
    this.numeradorService.preview(idEmp, 'TURNO').subscribe({
      next: (data) => {
        this.formulario.get('id')?.patchValue(data.next_value);
      },
      error: (err) => {
        console.error('Error (previsualizarNumerador)', err);
      }
    });
  }

  /**
   * Formatea "Base" con separador de miles (###.###.###) mientras se escribe.
   * El FormControl (impBase) siempre guarda el numero real sin puntos - lo
   * que se envia al backend - el punto solo se aplica al valor mostrado en
   * el input, por eso no se usa formControlName aca sino [value]+ViewChild.
   */
  onImpBaseInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '');
    const valorNumerico = soloDigitos ? Number(soloDigitos) : null;
    this.formulario.get('impBase')?.setValue(valorNumerico);
    input.value = soloDigitos ? Number(soloDigitos).toLocaleString('es-CO') : '';
  }

  //Aplica el mismo formato al cargar un valor existente (edicion/vista).
  formatearImpBaseVisible(valor: number | null | undefined): void {
    if (!this.impBaseInputRef) {
      return;
    }
    this.impBaseInputRef.nativeElement.value = valor ? Number(valor).toLocaleString('es-CO') : '';
  }

  /**
  * Metodo para cargar la informacion de la bodega por el (id)
  * @returns No tiene return
  */
  ModoEdicion(id: number): void {
    console.log("ModoEdicion");
    this.turnoService.getTurnoById(id).subscribe({
      next: (data: Turnos) => {
        this.objeto = data;

        const logsFormArray = this.formulario.get('logs') as FormArray;
        logsFormArray.clear();
        if (this.objeto.logs?.length) {
          this.objeto.logs.forEach((log: any) => {
            logsFormArray.push(this.fb.group({
              operacion: [log.operacion],
              usuario_mod: [log.usuario_mod],
              fecha_mod: [log.fecha_mod]
            }));
          });
        }

        this.formulario.patchValue({
          idCaja: data.idCaja,
          Fecha: data.Fecha,
          status: data.status,
          impBase: data.impBase,
          usuario: data.usuario,
          observacion: data.Observacion
        });
        this.formulario.get('id')?.patchValue(data.id);
        this.formatearImpBaseVisible(data.impBase);

        if (data.caja) {
          this.SelectCajaControl.setValue({ idCaja: data.idCaja, nomCaja: data.caja.nomCaja } as any);
        }

        if (this.isReadOnly) {
          this.SelectCajaControl.disable();
        }
      },
      error: (err) => {
        console.error('Error al cargar el turno:', err);
        this.router.navigate(['/turno']);
      }
    });
  }

  enviarFormulario() {
    //Bloqueo si ya existe un turno abierto para el usuario (solo aplica al crear uno nuevo,
    //status_ref se carga via cargarUltimaCaja() unicamente en modo Nuevo).
    if (!this.isEditMode && this.formulario.get('status_ref')?.value === 'Abierta') {
      this.notificacion.showError('Ya tienes un turno abierto. Debes cerrarlo antes de abrir uno nuevo.');
      return;
    }

    //Asignacion de campos en cabezal
    console.log("enviarFormulario");
    this.formulario.patchValue({
      idCaja: this.SelectCajaControl.value?.idCaja,
      fechaMod: new Date().toISOString(),
      usuario: this.loginService.getUsuarioActual()?.usuario ?? '',
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

      this.turnoService.edit(this.objeto.id, payload).subscribe({
        next: (turno) => {
          this.notificacion.showSuccess('Turno actualizado con éxito!');
          this.router.navigate(['/turno']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el turno.');
        }
      });

    } else {
      console.log("Nuevo")

      this.turnoService.save(payload).subscribe({
        next: (turno) => {
          // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
          console.log(turno);
          this.notificacion.showSuccess('Turno Abierto con éxito!');
          this.router.navigate(['/turno']);
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

