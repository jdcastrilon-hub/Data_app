import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { ArticuloAutocompletComponent } from 'src/app/modules/resources/articulo-autocomplet/articulo-autocomplet.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ComboClienteComponent } from 'src/app/modules/resources/combo-cliente/combo-cliente.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Ventas } from 'src/app/core/models/Ventas/Ventas';
import { MatTableDataSource } from '@angular/material/table';
import { TasasCombo } from 'src/app/core/interfaces/Impuestos/TasasCombo';
import { MedioPago } from 'src/app/core/models/Ventas/medioPago';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { VentaServiceService } from 'src/app/core/services/Ventas/venta-service.service';
import { ServiciosiniService } from 'src/app/core/services/core/serviciosini.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ClienteSearch } from 'src/app/core/interfaces/Comercial/ClienteSearch';
import { Numerador } from 'src/app/core/models/core/Numerador';
import { VentaDisponible } from 'src/app/core/interfaces/Comercial/VentaDisponible';
import { ArticuloSearch } from 'src/app/core/models/Bodega/ArticuloSearch';
import { ComboLoteComponent } from 'src/app/modules/resources/combo-lote/combo-lote.component';
import { LoteDisponible } from 'src/app/core/interfaces/Bodega/LoteDisponible';
import { combineLatest, startWith } from 'rxjs';
import { AbrirturnoService } from 'src/app/core/services/Ventas/abrirturno.service';
import { ValidacionAbrirTurno } from 'src/app/core/interfaces/Comercial/ValidacionAbrirTurno';
import { ModalValturnoComponent } from 'src/app/modules/resources/modal-valturno/modal-valturno.component';
import { FacturaReporteService } from 'src/app/core/reports/Comercial/factura-reporte.service';
import { FormMediopagoComponent, LineaPago } from '../../../resources/form-mediopago/form-mediopago.component';
import { LoginService } from 'src/app/core/services/core/login.service';
import { MediospagoService } from 'src/app/core/services/Ventas/mediospago.service';

// Sentinel de UI, nunca se manda al backend como id_mediopago real - solo
// activa la grilla de lineas de pago (form-mediopago) cuando se selecciona.
const PAGO_MIXTO_SENTINEL: MedioPago = { id: -1, tipo: 'Pago Mixto' };


@Component({
  selector: 'form-ventapos',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatDialogModule, ComboClienteComponent, MatDatepickerModule,
    MatCheckboxModule, ArticuloAutocompletComponent, ComboLoteComponent, FormMediopagoComponent],
  templateUrl: './form-ventapos.component.html',
  styleUrl: './form-ventapos.component.scss'
})
export class FormVentaposComponent {

  //Variables Generales
  formulario!: FormGroup;
  objeto!: Ventas;
  idCajaActiva: number = 0;
  objeto_caja!: ValidacionAbrirTurno;
  titulo_form: string = 'VENTA POS';
  isEditMode: boolean = false; //Se define si el modo es nuevo o edicion
  isReadOnly: boolean = false; //Se define si el modo es solo lectura (view)
  mostrarCampos: boolean = false;
  // Se activa solo cuando se intento abrir /edit/:id de una venta cuyo turno ya
  // esta cerrado - el formulario se fuerza a solo-lectura (ver ModoEdicion) y este
  // flag es lo que hace visible el aviso explicando por que.
  turnoCerrado: boolean = false;
  // Se pone en true la primera vez que se intenta guardar; recien ahi se pintan
  // en rojo los campos obligatorios sin llenar (combo-cliente, ver mostrarError).
  intentoGuardar: boolean = false;
  // Indice de pestana activa (0=Datos Generales, 1=Medio de Pago y Totales) -
  // controlado por codigo para poder saltar a la pestana de pago cuando el
  // guardado falla por no haber distribuido el pago mixto (ver enviarFormulario).
  selectedTabIndex: number = 0;

  //tabla de articulos
  //detalle: CompraDetalle[] = [];
  dataSource = new MatTableDataSource<FormGroup>();
  todasLasColumnas: string[] = ['position', 'id', 'Lote', 'stock', 'precio', 'cantidad', 'porc_dcto', 'impuesto1', 'neto', 'imp_dcto', 'imp1', 'total'];
  displayedColumns: string[] = [];

  //Informacion general de articulos
  //list_info_Articulos: AjusteStockInfoArticulos[] = [];

  //Tipos de dcto
  defaultdcto = 'No Aplica'; //Valor por defecto
  list_dcto: String[] = ['No Aplica', 'General', 'Detalle'];
  SelecdctoControl = new FormControl<String | null>(this.defaultdcto, Validators.required);

  //Para habilitar o deshabilitar el autoCompletar del articulo
  isModalClosing = true;
  columnasEditables = false; //para columnas de descuento

  //lista de medios de pago
  list_mediospago: MedioPago[] = [];
  SelecmediosControl = new FormControl<MedioPago | null>(null, Validators.required);
  // Lineas armadas por form-mediopago cuando se elige "Pago Mixto" (id/tipo/valor
  // reales por medio de pago) - reemplaza al viejo campo unico formaPago/idPago.
  lineasPagoMixto: LineaPago[] = [];
  // Solo se llena en modo edicion/vista, para precargar la grilla con lo ya guardado.
  lineasPagoIniciales: LineaPago[] = [];

  get esPagoMixto(): boolean {
    return this.SelecmediosControl.value?.tipo === 'Pago Mixto';
  }

  // La grilla de pago mixto no debe poder elegir "Pago Mixto" como si fuera
  // un medio real - se filtra el sentinel de la lista que se le pasa.
  get mediosPagoReales(): MedioPago[] {
    return this.list_mediospago.filter(m => m.id !== PAGO_MIXTO_SENTINEL.id);
  }

  onPagosActualizados(lineas: LineaPago[]) {
    this.lineasPagoMixto = lineas;
  }

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;
  @ViewChild('impIgresoInput') impIgresoInputRef!: ElementRef<HTMLInputElement>;
  // Solo existe mientras "Pago Mixto" esta seleccionado (el @if del template lo
  // monta/desmonta) - opcional porque puede no estar presente al momento del reset.
  @ViewChild(FormMediopagoComponent) formMediopagoRef?: FormMediopagoComponent;

  constructor(private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private VentasService: VentaServiceService,
    private serviceIni: ServiciosiniService,
    private turnoService: AbrirturnoService,
    private reporteService: FacturaReporteService,
    private notificacion: NotificacionesService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private loginService: LoginService,
    private mediospagoService: MediospagoService,
    private router: Router) {
    this.objeto = new Ventas();
  }

  ngOnInit() {
    console.log(this.objeto);

    let cliente_filtro: ClienteSearch = {
      idCliente: 0,
      idPersona: 0,
      codTit: '',
      nombreCompleto: ''
    }
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      idTrans: this.objeto.idTrans,
      idEmp: this.objeto.idEmp,
      idSucursalEmp: this.objeto.idSucursalEmp,
      // min(1): idCliente arranca en 0 (sin seleccionar) y Validators.required NO
      // rechaza 0 (solo null/undefined/''), min(1) si lo hace - mismo criterio
      // que venta-directa.
      idCliente: [this.objeto.idCliente, [Validators.required, Validators.min(1)]],
      fecDoc: [new Date(), Validators.required],
      idBodega: this.objeto.idBodega,
      idEstado: this.objeto.idEstado,
      impNeto: this.objeto.impNeto,
      impDescuento: this.objeto.impDescuento,
      impTotal: this.objeto.impTotal,
      observaciones: this.objeto.observaciones,
      documento: this.objeto.documento,
      serie: this.objeto.serie,
      nroDocum: [{ value: this.objeto.nroDocum, disabled: true }, Validators.required],
      secuencia: this.objeto.secuencia,
      factura: this.objeto.factura,
      idTurno: this.objeto.idTurno,
      nomCaja: [{ value: this.objeto.nomCaja, disabled: true }, Validators.required],
      tipoDcto: this.objeto.tipoDcto,
      porcDescuento: [{ value: this.objeto?.porcDescuento ?? 0, disabled: true }],
      fecVenc: [new Date(), Validators.required],
      vista: this.objeto.vista,
      fechaMod: this.objeto.fechaMod,

      //Medio de pago
      impIgreso: this.objeto.impIgreso,
      impVuelto: this.objeto.impVuelto,

      //Impuestos
      impuesto1: this.objeto.impuesto1,
      valorImpuesto1: this.objeto.valorImpuesto1,
      impuesto2: this.objeto.impuesto2,
      valorImpuesto2: this.objeto.valorImpuesto2,
      impuesto3: this.objeto.impuesto3,
      valorImpuesto3: this.objeto.valorImpuesto3,

      //Cliente de autoCompletar
      searchCliente: cliente_filtro,

      //Caja


      //Auditoria
      logs: this.fb.array([]),
      detalles: this.fb.array([])
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');

    // Subcribir los cambios al selecionar el tipo de descuento (aplica en modo Nuevo
    // y Edicion - antes vivian dentro del branch de "Nuevo" mas abajo, asi que en
    // edicion el enable/disable de "porcDescuento" nunca reaccionaba al tipoDcto
    // real de la venta cargada, aunque su VALOR si se restaurara bien).
    this.SelecdctoControl.valueChanges.subscribe(objDcto => {
      const porcDescuentoControl = this.formulario.get('porcDescuento');

      if (porcDescuentoControl) {
        if (objDcto === 'No Aplica') {
          porcDescuentoControl.disable(); // Desactiva si eligen 'No Aplica' o 'Detalle'
          porcDescuentoControl.setValue(0); // Opcional: Limpia el valor si deja de aplicar
          this.ValidarColumnas("No Aplica");
          this.aplicarDescuentoGeneral();
        } if (objDcto === 'General') {
          porcDescuentoControl.enable(); // <-- Corregido: Agregados los paréntesis ()
          this.ValidarColumnas("General");
          this.aplicarDescuentoGeneral();
        } if (objDcto === 'Detalle') {
          porcDescuentoControl.disable(); // Desactiva si eligen 'No Aplica' o 'Detalle'
          porcDescuentoControl.setValue(0); // Opcional: Limpia el valor si deja de aplicar
          this.ValidarColumnas("Detalle");
        }

      }
    });

    //Subcribimos los cambios al campo "porcDescuento"
    this.formulario.get('porcDescuento')?.valueChanges.subscribe(() => {
      if (this.SelecdctoControl.value === 'General' || this.SelecdctoControl.value === 'No Aplica') {
        this.aplicarDescuentoGeneral();
      }
    });

    // Se registra ANTES del if/else de modo nuevo/edicion (antes solo se suscribia
    // dentro de la rama "Nuevo") - en modo edicion/vista, ModoEdicion() setea
    // SelecmediosControl via setValue() y esta suscripcion tiene que estar activa
    // para que "mostrarCampos" (que oculta/muestra el bloque VUELTO) refleje el
    // medio de pago real de la venta cargada, no el valor por defecto (false).
    this.SelecmediosControl.valueChanges.subscribe(objPago => {
      if (objPago) {
        if (objPago.tipo === 'Efectivo') {
          this.mostrarCampos = false;
        } else {
          this.mostrarCampos = true;
        }
      }
    });

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición/Visualizacion
        console.log("Edicion")
        this.isEditMode = true;
        this.ModoEdicion(Number(id)); // Llama al método de carga


      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        console.log("Nuevo")
        this.isEditMode = false;
        this.objeto = new Ventas();

        this.validarTurno();
        //this.cargarSucursales();
        this.agregarLineaVacia();
        this.ValidarColumnas(this.defaultdcto);
      }
    })

  }

  //Metodo para cargar la venta POS que viene para edicion/visualizacion
  ModoEdicion(id: number): void {
    console.log("ModoEdicion");
    this.VentasService.getVentaById(id).subscribe({
      next: (data: Ventas) => {
        this.objeto = data;
        this.titulo_form = this.isReadOnly ? 'DETALLE VENTA POS' : 'ACTUALIZACION VENTA POS';

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
          idTrans: data.idTrans,
          idEmp: data.idEmp,
          idSucursalEmp: data.idSucursalEmp,
          idCliente: data.idCliente,
          fecDoc: data.fecDoc,
          idBodega: data.idBodega,
          idEstado: data.idEstado,
          observaciones: data.observaciones,
          documento: data.documento,
          serie: data.serie,
          secuencia: data.secuencia,
          idTurno: data.idTurno,
          nomCaja: data.nomCaja,
          fecVenc: data.fecVenc,
          impIgreso: data.impIgreso,
          impVuelto: data.impVuelto,
          porcDescuento: data.porcDescuento
        });
        this.formulario.get('nroDocum')?.patchValue(data.nroDocum);
        this.formatearImpIgresoVisible(data.impIgreso);

        // Carga el combo real de medios de pago (antes esto solo pasaba en modo
        // "Nuevo", via validarTurno() - en edicion "Forma Pago" quedaba vacio
        // pese a que la venta si tenia un medio guardado) y resuelve la
        // seleccion: un solo medio -> se elige directo; varios -> "Pago Mixto"
        // + se precarga la grilla con lo ya guardado.
        this.mediospagoService.list().subscribe({
          next: (medios) => {
            this.list_mediospago = [...medios, PAGO_MIXTO_SENTINEL];
            const detallesPago = data.detallesPago;
            if (detallesPago && detallesPago.length === 1) {
              const medioReal = this.list_mediospago.find(m => m.id === detallesPago[0].idMediopago);
              if (medioReal) {
                this.SelecmediosControl.setValue(medioReal);
              }
            } else if (detallesPago && detallesPago.length > 1) {
              this.SelecmediosControl.setValue(PAGO_MIXTO_SENTINEL);
              this.lineasPagoIniciales = detallesPago.map(d => ({
                idMediopago: d.idMediopago,
                tipo: d.mediopago?.tipo ?? '',
                valor: Number(d.importe)
              }));
            }
            if (this.isReadOnly) {
              this.SelecmediosControl.disable();
            }
          },
          error: (err) => console.error('Error cargando medios de pago', err)
        });

        // SelecdctoControl (tipo de descuento) nunca se restauraba en edicion -
        // se quedaba siempre en su valor por defecto ("No Aplica"), lo que ademas
        // dejaba "porcDescuento" deshabilitado sin importar el % real guardado
        // (ver valueChanges de SelecdctoControl en ngOnInit). Mismo fix que en
        // venta-directa.
        if (data.tipoDcto) {
          this.SelecdctoControl.setValue(data.tipoDcto);
        }

        this.onClienteChange(data.cliente);

        // "nomCaja" no viene en la respuesta del backend (VentaBase no tiene ese
        // campo, solo idTurno) - se resuelve aca via el turno guardado, mismo fix
        // ya aplicado en venta-directa. De paso, si ese turno ya esta cerrado, la
        // venta pasa a solo-lectura aunque la ruta haya sido /edit/:id - las ventas
        // POS siempre se hacen con turno (nunca caja manual), asi que esta regla
        // aplica siempre que hay idTurno.
        if (data.idTurno) {
          this.turnoService.getTurnoById(data.idTurno).subscribe({
            next: (turno) => {
              this.formulario.get('nomCaja')?.patchValue(turno.caja?.nomCaja || '');

              if (this.isEditMode && turno.status === false) {
                this.isReadOnly = true;
                this.turnoCerrado = true;
                this.titulo_form = 'DETALLE VENTA POS';
                this.bloquearFormularioSoloLectura();
              }
            }
          });
        }

        const detallesArray = this.detalles;
        detallesArray.clear();
        (data.detalles || []).forEach((det: any) => {
          let stockData: VentaDisponible = {
            idArticulo: det.idArticulo,
            idCodBarra: det.idCodBarra,
            codArticulo: '',
            nomArticulo: det.referencia || '',
            stock: det.stock || 0,
            ubicacion: '',
            idLote: det.idLote,
            costo: 0,
            precio: det.precio,
            neto: det.neto,
            objimpuesto1: { id: det.idTasaimp1, tasaImpuesto: det.impuesto1, porcentaje: 0, descripcion: '' },
            impuesto1: det.impuesto1,
            tasaimpuesto1: det.idTasaimp1,
            valor_impu1: det.valorImpuesto1,
            total: det.importeTotal
          };
          let articuloFiltro: ArticuloSearch = {
            idArticulo: det.idArticulo,
            codArticulo: '',
            nomArticulo: det.referencia || ''
          };

          const nuevoDetalle = this.crearDetalleForm(stockData, det.linea, articuloFiltro);
          nuevoDetalle.patchValue({
            precio: det.precio,
            cantidad: det.cantidad,
            porc_dcto: det.porcDcto,
            imp_dcto: det.importeDcto,
            idLote: det.idLote,
            neto: det.neto,
            importeTotal: det.importeTotal,
            valorImpuesto1: det.valorImpuesto1
          });
          nuevoDetalle.get('search')?.disable();
          detallesArray.push(nuevoDetalle);
        });
        this.dataSource.data = detallesArray.controls as FormGroup[];

        if (!this.isReadOnly) {
          this.agregarLineaVacia();
        }
        this.ValidarColumnas(this.SelecdctoControl.value as string | null);

        if (this.isReadOnly) {
          this.bloquearFormularioSoloLectura();
        }
      },
      error: (err) => {
        console.error('Error al cargar la venta POS:', err);
        this.router.navigate(['/ventapos']);
      }
    });
  }

  // Deshabilita todo el formulario (misma logica ya usada para /view/:id) - se
  // extrajo aca para poder reutilizarla cuando se detecta que el turno de una
  // venta ya esta cerrado y por lo tanto tampoco se debe permitir editarla.
  private bloquearFormularioSoloLectura(): void {
    this.formulario.disable();
    this.SelecdctoControl.disable();
    this.SelecmediosControl.disable();
  }

  /*
Receptores
*/
  recibirEstado(estado: any) {
    console.log('El padre recibió la estado:', estado);
    this.formulario.patchValue({
      idEstado: estado.id
    });
  }

  onClienteChange(cliente: ClienteSearch) {
    console.log('onProveedorChange:', cliente);
    if (cliente != null) {
      this.formulario.patchValue({
        idCliente: cliente.idCliente,
        searchCliente: cliente
      });
      this.formulario.get('searchCliente')?.disable();
    } else {
      this.formulario.get('searchCliente')?.enable();
      this.formulario.patchValue({
        idCliente: 0,
        searchCliente: cliente
      });
    }
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
        const serie = this.formulario.get('serie')?.value || '';
        const fact = `${serie}${data.next_value}`;

        this.formulario.get('nroDocum')?.patchValue(data.next_value);
        this.formulario.get('factura')?.patchValue(fact)
      },
      error: (err) => {
        console.error('Error (obtenerNumerador)', err);
      }
    });
  }

  validarTurno() {
    const usuario = this.loginService.getUsuarioActual()?.usuario ?? '';

    this.turnoService.ValidacionTurno(usuario).subscribe({
      next: (data) => {
        if (data.tieneturno && data.turnoVencido) {
          // El turno existe pero ya supero horas_turno de la caja - se bloquea
          // igual que "sin turno", pero con un mensaje especifico que manda a
          // cerrarlo (no a abrir uno nuevo, ya tiene uno pendiente).
          this.bloquearPantallaVencido(data.horasTranscurridas, data.horasLimite);
          return;
        }
        if (data.tieneturno) {
          this.objeto_caja = data;
          console.log("Respuesta")
          console.log(data)
          this.idCajaActiva = data.idTurno;

          //carga cliente por defecto de la caja
          let cliente_filtro: ClienteSearch = {
            idCliente: this.objeto_caja.cliente.idCliente,
            idPersona: this.objeto_caja.cliente.idPersona,
            codTit: this.objeto_caja.cliente.codTit,
            nombreCompleto: this.objeto_caja.cliente.nombreCompleto,
          }
          //Asignamos al path
          this.formulario.patchValue({
            idTurno: this.objeto_caja.idTurno,
            idSucursalEmp: this.objeto_caja.idSucursal,
            idBodega: this.objeto_caja.idBodega,
            idEstado: this.objeto_caja.idEstado,
            documento: this.objeto_caja.documento,
            nomCaja: this.objeto_caja.nomCaja,
            idCliente: this.objeto_caja.cliente.idCliente,
            searchCliente: cliente_filtro
          });
          //carga de tipos de pagos
          this.list_mediospago = [...data.mediopago!, PAGO_MIXTO_SENTINEL];
          const primermedio = this.list_mediospago[0];
          if (primermedio) {
            this.SelecmediosControl.setValue(primermedio);
          }

        } else {
          console.log("Caja no abierta")
          this.bloquearPantalla();
        }

      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  bloquearPantalla() {
    this.dialog.open(ModalValturnoComponent, {
      width: '400px',
      disableClose: true // Evita que lo cierren haciendo clic afuera
    });
  }

  bloquearPantallaVencido(horasTranscurridas?: number, horasLimite?: number) {
    this.dialog.open(ModalValturnoComponent, {
      width: '420px',
      disableClose: true,
      data: {
        titulo: 'Turno Vencido',
        mensaje: `Tienes un turno abierto desde hace ${horasTranscurridas ?? '?'} horas (limite: ${horasLimite ?? '?'} horas para esta caja). Debes cerrarlo antes de continuar.`,
        textoBoton: 'Cerrar Turno Ahora',
        ruta: '/cierreturno/new'
      }
    });
  }

  aplicarDescuentoGeneral(): void {
    console.log("aplicarDescuentoGeneral");
    console.log(this.SelecdctoControl.value);
    // 1. Validamos que el tipo de descuento actual sea 'General'
    if (this.SelecdctoControl.value === 'General' || this.SelecdctoControl.value === 'No Aplica') {
      // 2. Capturamos el porcentaje definido en la cabecera (maestro)
      const porcentajeGlobal = this.formulario.get('porcDescuento')?.value || 0;
      console.log(porcentajeGlobal);
      // 3. Iteramos sobre los FormGroups de tu FormArray (this.detalles)
      this.detalles.controls.forEach((control) => {
        const filaForm = control as FormGroup;

        // Actualizamos el control de la fila. 
        // Al cambiar este valor, el combineLatest interno de esa fila se ejecutará automáticamente.
        filaForm.get('porc_dcto')?.setValue(porcentajeGlobal);
      });
    }
  }



  //Metodos de la grilla

  // Método para obtener el FormArray de detalles
  get detalles(): FormArray {
    return this.formulario.get('detalles') as FormArray;
  }

  ValidarColumnas(tipoDcto: string | null) {
    // "Lote" ya no se oculta de forma fija: se mantiene siempre en la tabla y
    // cada fila decide si muestra el combo-lote o un "-" segun si el articulo
    // de ESA fila maneja lote (ver celda "Lote" en el html, mismo patron que
    // ajuste-stock/ValidarColumnas).
    if (tipoDcto === 'General' || tipoDcto === 'Detalle') {
      this.displayedColumns = this.todasLasColumnas;

      // Si es 'Detalle' permitimos editar, si es 'General' quedan bloqueadas
      this.columnasEditables = (tipoDcto === 'Detalle');
    } else {
      // 'No Aplica' o null: Ocultamos solo la columna de descuento.
      this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'porc_dcto');
      this.columnasEditables = false;
    }
  }

  /**
   * Metodo que tiene como finalidad agregar una linea vacia al final de la grilla. Se utiliza
   * cuando se carga una linea por el metodo "onArticuloChange"
   
   * @returns No tiene return
   */
  agregarLineaVacia(): void {

    //Se carga un metodo vacio de Impuestos
    let impuesto_base: TasasCombo = {
      id: 0,
      tasaImpuesto: '',
      porcentaje: 0,
      descripcion: 'Seleccion'
    }

    //Se carga un metodo vacio de StockDisponible
    let stockData: VentaDisponible = {
      idArticulo: 0,
      idCodBarra: 0,
      codArticulo: '',
      nomArticulo: '',
      stock: 0,
      ubicacion: '',
      idLote: '',
      costo: 0,
      precio: 0,
      neto: 0,
      objimpuesto1: impuesto_base,
      impuesto1: 'IVA',
      tasaimpuesto1: 0,
      valor_impu1: 0,
      total: 0
    };
    //Se carga un metodo vacio de ArticuloSearch
    let articulo_filtro: ArticuloSearch = {
      idArticulo: 0,
      codArticulo: '',
      nomArticulo: ''
    }

    // Calcular la siguiente línea
    const nextLinea = this.detalles.length + 1;

    // crear linea vacia por FormGroup
    const nuevoDetalle = this.crearDetalleForm(stockData, nextLinea, articulo_filtro);

    // Suscribir los cambios que puede tomar los campos de cantidad y costo
    // Obtenemos referencias a los controles específicos

    const precioCtrl = nuevoDetalle.get('precio');
    const cantidadCtrl = nuevoDetalle.get('cantidad');
    const dctoCtrl = nuevoDetalle.get('porc_dcto');
    const porc_IVA = nuevoDetalle.get('porc_tasa1');

    //subcripcion para columna neto.
    if (cantidadCtrl && dctoCtrl && porc_IVA && precioCtrl) {
      combineLatest([
        cantidadCtrl.valueChanges.pipe(startWith(cantidadCtrl.value)),
        dctoCtrl.valueChanges.pipe(startWith(dctoCtrl.value)),
        porc_IVA.valueChanges.pipe(startWith(porc_IVA.value)),
        precioCtrl.valueChanges.pipe(startWith(precioCtrl.value)),

      ]).subscribe(([cantidad, porc_dcto, porc_tasa1, precio]) => {
        console.log('Calculando...', { precio, cantidad }); // Ahora sí debería entrar
        const Netototal = this.redondear2((precio || 0) * (cantidad || 0));
        const imp_dcto = this.redondear2(Netototal * ((porc_dcto / 100)));
        const valorImpu1 = this.redondear2(((Netototal - imp_dcto) || 0) * ((porc_tasa1 / 100) || 0));

        nuevoDetalle.get('neto')?.setValue(Netototal, { emitEvent: false });
        nuevoDetalle.get('valorImpuesto1')?.setValue(valorImpu1, { emitEvent: false });
        nuevoDetalle.get('imp_dcto')?.setValue(imp_dcto, { emitEvent: false });
        nuevoDetalle.get('importeTotal')?.setValue(this.redondear2(Netototal - imp_dcto + valorImpu1), { emitEvent: false });

      });
    }
    // añadir al FormGroup general
    this.detalles.push(nuevoDetalle);
    this.dataSource.data = this.detalles.controls as FormGroup[];
  }

  // Cantidad obligatoria y mayor a 0 solo si la fila ya tiene articulo seleccionado
  // (la fila vacia final del grid no debe marcarse en rojo antes de tiempo) - mismo
  // patron ya aplicado en venta-directa.
  validarCantidadPositiva = (control: AbstractControl): ValidationErrors | null => {
    const fila = control.parent;
    const idArticulo = fila?.get('idArticulo')?.value;
    if (!idArticulo) {
      return null;
    }
    if (control.value === null || control.value === undefined || control.value === '') {
      return { required: true };
    }
    return Number(control.value) > 0 ? null : { min: { min: 1, actual: control.value } };
  };

  // Una venta siempre resta stock (no hay motivo/signo como en ajustestock), asi
  // que la validacion es incondicional.
  validarStockDisponible = (control: AbstractControl): ValidationErrors | null => {
    const fila = control.parent;
    const idArticulo = fila?.get('idArticulo')?.value;
    if (!idArticulo) {
      return null;
    }
    const stock = Number(fila?.get('stock')?.value) || 0;
    const cantidad = Number(control.value) || 0;
    return cantidad > stock ? { stockInsuficiente: true } : null;
  };

  // Si el articulo de la fila maneja lote, se debe haber seleccionado uno real
  // (id > 0) - mismo validador que ajuste-stock.
  validarLoteRequerido = (control: AbstractControl): ValidationErrors | null => {
    const fila = control.parent;
    const manejaLote = fila?.get('manejaLote')?.value;
    if (!manejaLote) {
      return null;
    }
    return Number(control.value) > 0 ? null : { loteRequerido: true };
  };

  // Se activa cuando el combo-lote de una fila emite un lote seleccionado.
  // A diferencia de ajuste-stock, en ventas no se permite crear un lote nuevo
  // (no tiene sentido vender de un lote que todavia no existe), asi que no hay
  // manejo de "esNuevo"/nuevosLotes aca.
  onLoteChange(lote: LoteDisponible, index: number): void {
    const fila = this.detalles.at(index);
    fila.patchValue({ idLote: lote.idLote });
    fila.get('idLote')?.updateValueAndValidity();
  }

  /**
    * Metodo para crear los datos de la linea vacia.
    * @returns No tiene return
    */
  crearDetalleForm(data: VentaDisponible, nextLinea: number, search: ArticuloSearch): FormGroup {

    return this.fb.group({
      // Estructura de ID que ya tenías
      //llave compuesta
      idTrans: [null],
      linea: [nextLinea, Validators.required],
      idArticulo: [data.idArticulo, Validators.required],
      idCodBarra: [data.idCodBarra, Validators.required],
      referencia: [data.nomArticulo],
      costoUnit: [0, [Validators.required, Validators.min(0)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      cantidad: [0, [this.validarCantidadPositiva, this.validarStockDisponible]],
      porc_dcto: [0, [Validators.required, Validators.min(0)]],
      imp_dcto: 0,
      idLote: [0, this.validarLoteRequerido],
      // Solo indica si la celda "Lote" debe mostrar el combo (no se envia al
      // backend, ver enviarFormulario) - mismo patron que ajuste-stock.
      manejaLote: false,
      stock: data.stock,
      //objimpuesto1: [data.objimpuesto1],
      impuesto1: "IVA",
      idTasaimp1: [data.tasaimpuesto1],
      porc_tasa1: 0,
      valorImpuesto1: [{ value: data.valor_impu1, disabled: true }],
      impuesto2: "N",
      idTasaimp2: 0,
      valorImpuesto2: 0,
      impuesto3: "N",
      idTasaimp3: 0,
      valorImpuesto3: 0,
      neto: 0,
      importeTotal: [{ value: data.total, disabled: true }],
 
      // Campo de entrada de usuario
      search: search,
      btoCrearCodBarra: true //Inicializa el boton deshabilitado
    });
  }



  /**
   * Metodo que se activa , cuando se recupera el articulo del componente articulo-autocomplet
   *
   * @param articulo ArticuloSearch , es el objecto que me retorna el autocompletar 
   *                 con la informacion basica del articulo seleccionado .
   * @param index Linea o index de la tabla
   * @returns No tiene return
   */
  onArticuloChange(articulo: ArticuloSearch, index: number) {
    console.log("onArticuloChange" + articulo)

    if (articulo != null) {

      // Si el mismo articulo (mismo codigo de barra) ya esta cargado en otra fila,
      // no se vuelve a consultar la API: se suma 1 a la cantidad de esa fila (el
      // recalculo de neto/impuesto/total ya es reactivo, ver la suscripcion
      // combineLatest en agregarLineaVacia) y esta fila (la que disparo el
      // escaneo/seleccion) se limpia para seguir siendo la fila vacia de captura.
      // Especialmente relevante en POS, donde escanear el mismo producto dos
      // veces es el caso comun, no la excepcion.
      const indexExistente = this.detalles.controls.findIndex((fila, i) =>
        i !== index &&
        fila.get('idArticulo')?.value === articulo.idArticulo &&
        fila.get('idCodBarra')?.value === articulo.idCodBarra
      );

      if (indexExistente >= 0) {
        const filaExistente = this.detalles.at(indexExistente);
        const cantidadActual = Number(filaExistente.get('cantidad')?.value) || 0;
        filaExistente.get('cantidad')?.setValue(cantidadActual + 1);

        this.detalles.at(index).get('search')?.setValue(null);
        return;
      }

      //Se cargar las variables de bodega y estado , para consultar por el inventario.
      const idBodega = this.formulario.value.idBodega;
      const idEstado = this.formulario.value.idEstado;
      //Con el articulo seleccionado se consulta por API , el stock.
      this.serviceIni.stkVentaDisponible(articulo.idArticulo!, articulo.idCodBarra!, idBodega!, idEstado!).subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            //El api solo debe responder con una sola linea.
            const stockData = data[0];
            console.log(stockData);

            const valorIVA = this.redondear2(Number(stockData.precio) * (Number(stockData.porcentaje) / 100));
            const total = this.redondear2(Number(stockData.precio) + valorIVA);

            const fila = this.detalles.at(index);
            fila.patchValue({
              idTrans: null,
              idArticulo: articulo.idArticulo,
              idCodBarra: articulo.idCodBarra,
              linea: index + 1,
              precio: stockData.precio,
              stock: stockData.stock,
              idTasaimp1: stockData.impuesto,
              porc_tasa1: stockData.porcentaje,
              valorImpuesto1: valorIVA,
              importeTotal: total,
              neto: stockData.precio,
              cantidad: 1,
              precioTotal: stockData.precio,
              nombreArticulo: articulo.nomArticulo,
              codigoArticulo: articulo.codArticulo,
              referencia:articulo.nomArticulo,
              // Se resetea idLote (un articulo distinto no puede quedarse con el lote
              // del articulo anterior) y se marca si este articulo maneja lote -
              // mismo patron que ajuste-stock.
              idLote: 0,
              manejaLote: articulo.manejaLote || false,
              search: articulo //articulo para bloquear la columna de search
            });
            fila.get('idLote')?.updateValueAndValidity();
            fila.get('search')?.disable(); //Se bloque la primera columna.
            fila.get('btoCrearCodBarra')?.setValue(true);
            this.agregarLineaVacia();
          }

        },
        error: (err) => {
          console.error('Error (onArticuloChange)', err);
        }
      });
    }

  }

  /**
* Metodo para eliminar la ultima linea de la tabla , ya que esta vacio , se utiliza en el evento post
* @returns No tiene return
*/
  eliminarLineaDetalles(index: number): void {
    // 1. Obtenemos el grupo de la fila actual
    const fila = this.detalles.at(index) as FormGroup;

    // 2. Extraemos el objeto search
    const searchObj: ArticuloSearch = fila.get('search')?.value;
    if (!searchObj || !searchObj.idArticulo) {
      console.warn("No se puede eliminar una línea que no tiene un artículo cargado.");
      // Opcional: Mostrar un Toast o alerta de SweetAlert
      return;
    }
    this.detalles.removeAt(index);
    this.dataSource.data = this.detalles.controls as FormGroup[];

    if (this.detalles.length == 0) {
      this.agregarLineaVacia();
    }
  }

  //totales de grilla

  /** Redondea a maximo 2 decimales (NUMERIC(14,2)) evitando el arrastre de
   * error de punto flotante de JS (ej. 0.1+0.2 -> 36.480000000000004). */
  private redondear2(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  get totalNeto(): number {
    // 1. Obtenemos el array de valores (incluyendo los campos disabled como 'neto')
    const todasLasFilas = this.detalles.getRawValue();

    // 2. Sumamos el campo 'neto' de cada objeto en el array
    return this.redondear2(todasLasFilas.reduce((acumulado, fila) => {
      return acumulado + (Number(fila.neto) || 0);
    }, 0));
  }

  get totalFinal(): number {
    // 1. Obtenemos el array de valores (incluyendo los campos disabled como 'neto')
    const todasLasFilas = this.detalles.getRawValue();

    // 2. Sumamos el campo 'neto' de cada objeto en el array
    return this.redondear2(todasLasFilas.reduce((acumulado, fila) => {
      return acumulado + (Number(fila.importeTotal) || 0);
    }, 0));
  }

  // Solo Efectivo (medio unico, no Pago Mixto) tiene sentido de "vuelto" - una
  // transferencia o tarjeta siempre es por el monto exacto, no existe cambio.
  get esEfectivoSimple(): boolean {
    return !this.esPagoMixto && this.SelecmediosControl.value?.tipo?.toLowerCase() === 'efectivo';
  }

  // Valor a considerar como "recibido": si es efectivo y el cajero escribio algo,
  // se respeta (para calcular vuelto real); si lo dejo vacio, o el medio no es
  // efectivo/es pago mixto (donde el campo ni se muestra), se asume pago exacto -
  // el cliente entrego el dinero justo, sin necesidad de calcular cambio.
  get impIngresoEfectivo(): number {
    if (this.esEfectivoSimple) {
      const ingreso = Number(this.formulario.get('impIgreso')?.value) || 0;
      return ingreso > 0 ? ingreso : this.totalFinal;
    }
    return this.totalFinal;
  }

  /**
   * Formatea "Valor Ingreso" con separador de miles (###.###.###) mientras se
   * escribe - mismo patron ya usado en venta-directa/form-turnos/form-movimientocaja.
   * El FormControl (impIgreso) siempre guarda el numero real sin puntos - el
   * punto solo se aplica al valor mostrado en el input.
   */
  onImpIgresoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '');
    const valorNumerico = soloDigitos ? Number(soloDigitos) : null;
    this.formulario.get('impIgreso')?.setValue(valorNumerico);
    input.value = soloDigitos ? Number(soloDigitos).toLocaleString('es-CO') : '';
  }

  //Aplica el mismo formato al cargar un valor existente (edicion/vista).
  formatearImpIgresoVisible(valor: number | null | undefined): void {
    if (!this.impIgresoInputRef) {
      return;
    }
    this.impIgresoInputRef.nativeElement.value = valor ? Number(valor).toLocaleString('es-CO') : '';
  }

  get vuelto(): number {
    const ingreso = this.impIngresoEfectivo;
    const total = this.totalFinal;

    // Si no ha ingresado suficiente dinero, el vuelto es 0
    if (ingreso < total) {
      return 0;
    }

    return ingreso - total;
  }

  get totalCantidad(): number {
    const filas = this.detalles.getRawValue();
    return filas.reduce((acc, fila) => acc + (Number(fila.cantidad) || 0), 0);
  }

  get totalImpuesto1(): number {
    // 1. Obtenemos el array de valores (incluyendo los campos disabled como 'neto')
    const todasLasFilas = this.detalles.getRawValue();

    // 2. Sumamos el campo 'neto' de cada objeto en el array
    return this.redondear2(todasLasFilas.reduce((acumulado, fila) => {
      return acumulado + (Number(fila.valorImpuesto1) || 0);
    }, 0));
  }

  get totalDcto(): number {
    // 1. Obtenemos el array de valores (incluyendo los campos disabled como 'neto')
    const todasLasFilas = this.detalles.getRawValue();

    // 2. Sumamos el campo 'neto' de cada objeto en el array
    return this.redondear2(todasLasFilas.reduce((acumulado, fila) => {
      return acumulado + (Number(fila.imp_dcto) || 0);
    }, 0));
  }

  // Método para agregar el log al FormArray
  agregarLogAuditoria() {
    const logsArray = this.formulario.get('logs') as FormArray;

    // Una venta nueva (aun no persistida) no tiene historia real todavia - si
    // un intento anterior de guardar fallo (ej. error del backend) ya dejo una
    // entrada "Nuevo" pegada aca (resetCampos() solo limpia tras un guardado
    // EXITOSO), un reintento no debe acumular otra encima, se reemplaza. En
    // edicion si se acumula: cada guardado exitoso es un evento real distinto.
    if (!this.isEditMode) {
      logsArray.clear();
    }

    // 1. Obtienes el objeto de log ya completo y formateado del servicio
    const logData = this.logAuditoria.generarLog(!this.isEditMode ? 'Nuevo' : 'Edicion');

    // 2. Creas un nuevo FormGroup usando la data
    const auditoriaGroup = this.fb.group({
      operacion: [logData.operacion],
      usuario_mod: [logData.usuario_mod],
      fecha_mod: [logData.fecha_mod]
    });

    // 3. Lo añades al FormArray
    logsArray.push(auditoriaGroup);
  }

  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario")
    const fecha_envio = new Date()
    this.intentoGuardar = true; // A partir de aca se pintan en rojo los campos obligatorios vacios (ej. combo-cliente)

    this.formulario.patchValue({
      idEmp: 1,
      tipoDcto: this.SelecdctoControl.value,
      impNeto: this.totalNeto,
      impTotal: this.totalFinal,
      impuesto1: 'IVA',
      valorImpuesto1: this.totalImpuesto1,
      impuesto2: 'N/A',
      valorImpuesto2: 0,
      impuesto3: 'N/A',
      valorImpuesto3: 0,
      // impDescuento (el total de descuento a nivel de cabecera) quedaba hardcodeado
      // en 0 - mismo bug que venta-directa: el descuento por linea (imp_dcto) si se
      // guardaba bien en el detalle, pero nunca se sumaba hacia la cabecera pese a
      // que el getter totalDcto ya existia para esto.
      impDescuento: this.totalDcto,
      impVuelto: this.vuelto || 0,
      serie: this.objeto.serie || "",
      nroDocum: this.objeto.nroDocum || 0,
      secuencia: this.objeto.secuencia || "",
      factura: this.objeto.factura || "",
      // impIgreso SI se resuelve aca (a diferencia de observaciones) para que un
      // "Valor Ingreso" vacio -o de plano oculto, cuando el medio no es Efectivo-
      // no viaje null al backend (imp_ingreso es NOT NULL en t_facturas): el
      // getter ya respeta lo que el cajero haya escrito cuando aplica, y solo
      // sustituye por el total cuando el campo ni se muestra. Mismo criterio que
      // venta-directa. observaciones si se deja sin tocar aca porque el usuario
      // lo escribe libremente y no tiene un valor "efectivo" equivalente que
      // calcular - repatchearlo con "this.objeto" (el valor viejo) pisaria lo
      // que el cajero acaba de escribir/cambiar justo antes de guardar.
      impIgreso: this.impIngresoEfectivo,
      vista: 'VentaPOS',
      fechaMod: fecha_envio.toISOString()
    });
    console.log("Json original");

    this.formulario.markAllAsTouched(); // Pinta en rojo todos los campos obligatorios vacios

    // idCliente no tiene un <mat-error> visible propio (combo-cliente es un
    // componente aparte, se pinta via [mostrarError]), asi que ademas se avisa
    // con un mensaje explicito para que quede claro por que no se pudo guardar.
    if (this.formulario.get('idCliente')?.invalid) {
      this.notificacion.showError('Debes seleccionar un cliente antes de guardar.');
      return;
    }

    // La fila vacia final del grid siempre existe (idArticulo 0/null); se exige
    // al menos una linea con articulo real antes de permitir grabar.
    const hayArticulos = this.detalles.controls
      .some((fila: any) => fila.value.idArticulo !== 0 && fila.value.idArticulo !== null);
    if (!hayArticulos) {
      this.notificacion.showError('Debes agregar al menos un articulo antes de guardar.');
      return;
    }

    // Construye las lineas de pago: un solo medio (lo elegido en "Forma Pago")
    // o, si es "Pago Mixto", las lineas armadas por la grilla form-mediopago.
    // El backend vuelve a validar esta suma (single round-trip), esto es solo
    // feedback inmediato para el usuario antes de intentar guardar.
    const detallesPago = this.esPagoMixto
      ? this.lineasPagoMixto
        .filter(l => l.valor > 0)
        .map(l => ({ idMediopago: l.idMediopago, importe: l.valor }))
      : [{ idMediopago: this.SelecmediosControl.value?.id, importe: this.totalFinal }];

    const sumaPagos = this.redondear2(detallesPago.reduce((acc, d) => acc + (d.importe || 0), 0));
    if (Math.abs(sumaPagos - this.totalFinal) > 0.01) {
      this.notificacion.showError('La suma de los medios de pago no coincide con el total de la venta.');
      // Salta a "Medio de Pago y Totales" para que el usuario pueda distribuir
      // el pago mixto sin tener que ir a buscar la pestana manualmente.
      this.selectedTabIndex = 1;
      return;
    }

    if (this.formulario.invalid) {
      return; // El resto de los campos obligatorios ya quedaron en rojo arriba
    }

    // El log de auditoria se agrega solo cuando ya se paso todas las validaciones,
    // justo antes de armar el JSON a enviar - mismo motivo que en venta-directa:
    // si se agregaba antes, cada intento fallido dejaba una entrada de log extra
    // que nunca se limpiaba (resetCampos() solo corre tras un guardado exitoso).
    this.agregarLogAuditoria();

    console.log(this.formulario.getRawValue());
    console.log("Paso Json");

    // 1. Obtenemos todo el valor del formulario
    const dataCompleta = this.formulario.getRawValue();

    // 2. Limpiamos solo el arreglo de detalles
    // Usamos .map para recorrer cada línea y quitar 'search' y lo que no necesites
    // Se valida que solo se envien las lineas que tiene datos 
    const detallesLimpios = dataCompleta.detalles
      .filter((det: any) => det.idArticulo !== 0 && det.idArticulo !== null)
      .map((linea: any) => {
        // Desestructuración para quitar lo que no va al API
        const { search, btoCrearCodBarra, ...resto } = linea;
        return resto;
      });

    // 3. Creamos el objeto final que se enviará a la API
    const jsonParaAPI = {
      ...dataCompleta,        // Copiamos todo lo del formulario (idTrans, idEmp, etc.)
      detalles: detallesLimpios, // Reemplazamos los detalles originales por los limpios
      detallesPago,
      searchCliente: undefined // Si también quieres quitar el buscador de proveedor
    };

    // 4. Ahora sí, enviamos jsonParaAPI al servicio
    console.log('JSON Limpio:', jsonParaAPI);

    //Evento nuevo
    if (this.isEditMode) {
      console.log("Editar")

      this.VentasService.edit(this.objeto.idTrans!, jsonParaAPI).subscribe({
        next: (venta) => {
          this.notificacion.showSuccess('Venta POS actualizada con éxito!');
          this.router.navigate(['/ventapos']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar la venta.');
        }
      });

    } else {
      console.log("Nuevo")

      this.VentasService.savepos(jsonParaAPI).subscribe({
        next: (venta) => {
          // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
          console.log(venta);
          this.notificacion.showSuccess('venta guardada con éxito!');
          this.procesarImpresion(venta, this.formulario.value.searchCliente);
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar la venta.');
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
    this.objeto = new Ventas();
    this.formDirective.resetForm();
    // Recien empieza un registro nuevo: todavia no se intento guardar, asi que no
    // deben verse en rojo los campos obligatorios vacios (ver mostrarError), y
    // se vuelve a la primera pestana.
    this.intentoGuardar = false;
    this.selectedTabIndex = 0;
    //reset grilla de logs
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    //reset grilla de articulos
    const detalle = this.formulario.get('detalles') as FormArray;
    detalle.clear();
    // agregas la fila inicial "limpia"
    this.agregarLineaVacia();

    //actualizo referencias
    //carga cliente por defecto de la caja
    let cliente_filtro: ClienteSearch = {
      idCliente: this.objeto_caja.cliente.idCliente,
      idPersona: this.objeto_caja.cliente.idPersona,
      codTit: this.objeto_caja.cliente.codTit,
      nombreCompleto: this.objeto_caja.cliente.nombreCompleto,
    }
    //Asignamos al path
    this.formulario.patchValue({
      idTurno: this.objeto_caja.idTurno,
      idSucursalEmp: this.objeto_caja.idSucursal,
      idBodega: this.objeto_caja.idBodega,
      idEstado: this.objeto_caja.idEstado,
      documento: this.objeto_caja.documento,
      nomCaja: this.objeto_caja.nomCaja,
      idCliente: this.objeto_caja.cliente.idCliente,
      searchCliente: cliente_filtro,
      fecDoc: new Date(),
      fecVenc: new Date(),
      porcDescuento: 0
    });

    const primermedio = this.list_mediospago[0];
    if (primermedio) {
      this.SelecmediosControl.setValue(primermedio);
    }
    this.lineasPagoMixto = [];
    this.lineasPagoIniciales = [];
    // Si "Pago Mixto" sigue seleccionado tras el reset, form-mediopago no se
    // destruye/recrea via el @if del template - hay que pedirle explicitamente
    // que limpie su grilla interna, sino arrastra las lineas de la venta anterior.
    this.formMediopagoRef?.resetear();
  }


  async procesarImpresion(objeto: any, cliente: ClienteSearch) {
    console.log("procesarImpresion - Disparando impresión directa");
    console.log(objeto);
    console.log(cliente);
    const fechaObjeto = new Date(objeto.fecDoc);

    const facturaJson = {
      consecutivo: `${objeto.serie || ''}-${objeto.nroDocum || ''}`,
      fecha: new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Fuerza el formato de 24 horas (HH:mm)
      }).format(fechaObjeto).replace(',', ''),
      cliente: `${cliente.codTit || ''} - ${cliente.nombreCompleto || ''}`,
      items: objeto.detalles,
      neto : objeto.impNeto,
      impdcto : objeto.impDescuento,
      impIVA : objeto.valorImpuesto1,
      total: objeto.impTotal
    };

    try {
      // 1. Obtenemos la URL del PDF desde el servicio (que ya funciona perfectamente)
      const pdfUrl = await this.reporteService.generarUrlFactura(facturaJson);
      console.log("URL de factura generada con éxito:", pdfUrl);

      // 2. Creamos un iframe oculto dinámicamente en el documento
      // OJO: un iframe de 0x0 no dispara "load" en varios navegadores (Chrome no
      // llega a inicializar su visor de PDF interno para un iframe sin tamaño real),
      // asi que el blob se generaba bien pero el print() nunca se ejecutaba. Se usa
      // 1x1px posicionado fuera de pantalla en vez de 0x0 - sigue siendo invisible
      // para el usuario, pero el navegador si carga el PDF.
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '-9999px';
      iframe.style.bottom = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      iframe.src = pdfUrl;

      // 3. Esperamos a que el iframe cargue el PDF en memoria para lanzar la impresión
      iframe.onload = () => {
        if (iframe.contentWindow) {
          let yaLimpio = false;
          const limpiar = () => {
            if (yaLimpio) return;
            yaLimpio = true;
            iframe.remove();
            URL.revokeObjectURL(pdfUrl);
          };

          // 4. Limpieza: en navegadores modernos print() NO bloquea el hilo de JS
          // (el dialogo de impresion es asincrono), asi que un setTimeout corto
          // (el valor anterior, 1000ms) borraba el iframe y revocaba la URL del blob
          // MIENTRAS el dialogo todavia estaba abierto/renderizando - resultado: 2
          // segundos de dialogo en blanco y se cerraba solo. "afterprint" se dispara
          // recien cuando el usuario imprime o cancela el dialogo, asi que es el
          // momento correcto para limpiar. Se deja un timeout de respaldo generoso
          // por si "afterprint" no dispara en algun navegador (evita que el iframe
          // quede huerfano para siempre).
          iframe.contentWindow.addEventListener('afterprint', limpiar);
          setTimeout(limpiar, 60000);

          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
      };

      // Adjuntamos el iframe temporal al cuerpo de la aplicación para iniciar la carga
      document.body.appendChild(iframe);

    } catch (error) {
      console.error("Error al intentar procesar la impresión directa:", error);
    }
  }
}
