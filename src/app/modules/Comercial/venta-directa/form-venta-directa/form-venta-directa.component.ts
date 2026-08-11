import { Component, ElementRef, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { combineLatest, startWith } from 'rxjs';
import { BodegaCombo } from 'src/app/core/interfaces/Bodega/BodegaCombo';
import { ClienteSearch } from 'src/app/core/interfaces/Comercial/ClienteSearch';
import { Documentos_Combo } from 'src/app/core/interfaces/Comercial/Documentos_Combo';
import { VentaDisponible } from 'src/app/core/interfaces/Comercial/VentaDisponible';
import { SucursalCombo } from 'src/app/core/interfaces/Core/SucursalCombo';
import { TasasCombo } from 'src/app/core/interfaces/Impuestos/TasasCombo';
import { ArticuloSearch } from 'src/app/core/models/Bodega/ArticuloSearch';
import { Ventas } from 'src/app/core/models/Ventas/Ventas';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ServiciosiniService } from 'src/app/core/services/core/serviciosini.service';
import { NumeradorService } from 'src/app/core/services/core/numerador.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { SucursalServiceService } from 'src/app/core/services/General/sucursal-service.service';
import { TasaImpuestoService } from 'src/app/core/services/impuestos/tasa-impuesto.service';
import { VentaServiceService } from 'src/app/core/services/Ventas/venta-service.service';
import { AbrirturnoService } from 'src/app/core/services/Ventas/abrirturno.service';
import { CajasService } from 'src/app/core/services/Ventas/cajas.service';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { ArticuloAutocompletComponent } from 'src/app/modules/resources/articulo-autocomplet/articulo-autocomplet.component';
import { ComboClienteComponent } from 'src/app/modules/resources/combo-cliente/combo-cliente.component';
import { ComboEstadostockComponent } from 'src/app/modules/resources/combo-estadostock/combo-estadostock.component';
import { ComboLoteComponent } from 'src/app/modules/resources/combo-lote/combo-lote.component';
import { LoteDisponible } from 'src/app/core/interfaces/Bodega/LoteDisponible';
import { MedioPago } from 'src/app/core/models/Ventas/medioPago';
import { CajaCombo } from 'src/app/core/interfaces/Comercial/CajaCombo';
import { ListaPrecioCombo } from 'src/app/core/interfaces/Comercial/ListaPrecioCombo';
import { ListaprecioService } from 'src/app/core/services/Ventas/listaprecio.service';
import { FormMediopagoComponent, LineaPago } from 'src/app/modules/Comercial/resources/form-mediopago/form-mediopago.component';

// Sentinel de UI, nunca se manda al backend como id_mediopago real - solo
// activa la grilla de lineas de pago (form-mediopago) cuando se selecciona.
const PAGO_MIXTO_SENTINEL: MedioPago = { id: -1, tipo: 'Pago Mixto' };

@Component({
  selector: 'app-form-venta-directa',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, ComboClienteComponent, MatDatepickerModule,
    MatCheckboxModule, ArticuloAutocompletComponent, ComboEstadostockComponent,
    ComboLoteComponent, FormMediopagoComponent],
  templateUrl: './form-venta-directa.component.html',
  styleUrl: './form-venta-directa.component.scss'
})
export class FormVentaDirectaComponent {


  //Variables Generales
  formulario!: FormGroup;
  objeto!: Ventas;
  titulo_form: string = 'REGISTRO FACTURA';
  isEditMode: boolean = false; //Se define si el modo es nuevo o edicion
  isReadOnly: boolean = false; //Se define si el modo es solo lectura (view)
  // Se activa solo cuando se intento abrir /edit/:id de una venta cuyo turno ya
  // esta cerrado - el formulario se fuerza a solo-lectura (ver ModoEdicion) y este
  // flag es lo que hace visible el aviso explicando por que. No aplica a ventas
  // hechas por caja manual (sin turno), esas se pueden editar siempre.
  turnoCerrado: boolean = false;
  // Se pone en true la primera vez que se intenta guardar; recien ahi se pintan
  // en rojo los campos obligatorios sin llenar (combo-cliente, ver mostrarError).
  intentoGuardar: boolean = false;

  @ViewChild('formDirective') formDirective!: NgForm;
  @ViewChild('impIgresoInput') impIgresoInputRef!: ElementRef<HTMLInputElement>;

  //tabla de articulos
  //detalle: CompraDetalle[] = [];
  dataSource = new MatTableDataSource<FormGroup>();
  todasLasColumnas: string[] = ['position', 'id', 'Lote', 'stock', 'precio', 'cantidad', 'porc_dcto', 'impuesto1', 'neto', 'imp_dcto', 'imp1', 'total'];
  displayedColumns: string[] = [];

  //Informacion general de articulos
  //list_info_Articulos: AjusteStockInfoArticulos[] = [];

  //Status Compra
  defaultStatus = 'Borrador'; //Valor por defecto
  list_status: String[] = ['Borrador', 'Finalizado'];
  SelecStatusControl = new FormControl<String | null>(this.defaultStatus, Validators.required);

  //Seleccion para sucursales.
  list_sucursal: SucursalCombo[] = [];
  SelectSucursalControl = new FormControl<SucursalCombo | null>(null, Validators.required);

  //Bodegas
  list_bodegas: BodegaCombo[] = [];
  SelectBodegasControl = new FormControl<BodegaCombo | null>(null, Validators.required);

  //Impuestos
  list_impuestos: TasasCombo[] = [];
  SelectImpuestosControl = new FormControl<TasasCombo | null>(null, Validators.required);

  //Documentos
  list_documentos: Documentos_Combo[] = [];
  SelectdocumentoControl = new FormControl<Documentos_Combo | null>(null, Validators.required);

  //Tipos de dcto
  defaultdcto = 'No Aplica'; //Valor por defecto
  list_dcto: String[] = ['No Aplica', 'General', 'Detalle'];
  SelecdctoControl = new FormControl<String | null>(this.defaultdcto, Validators.required);

  //Para habilitar o deshabilitar el autoCompletar del articulo
  isModalClosing = true;
  columnasEditables = false; //para columnas de descuento
  mostrarFecVenc: boolean = false;

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

  // Caja/turno: escenario A (turno POS activo) muestra la caja de solo lectura;
  // escenario B (sin turno, ej. administrador) deja elegir entre las cajas
  // asociadas al usuario (m_cajasxuser). Ver project_data_comercial_module.
  tieneTurnoActivo: boolean = false;
  nombreCajaActiva: string = '';
  list_cajasUsuario: CajaCombo[] = [];
  // Requerido solo aplica en escenario B (sin turno activo); en escenario A el
  // control ni se muestra, por eso el guard en enviarFormulario() lo revisa
  // condicionado a !tieneTurnoActivo en vez de dejar Validators.required roto
  // el formulario cuando hay turno.
  SelectCajaUsuarioControl = new FormControl<CajaCombo | null>(null, Validators.required);

  // Lista de precios: resuelve contra que fila de s_precioxarticulo se cotiza
  // cada linea (ver ventadisponiblexbodega). Siempre visible en el encabezado
  // (aunque solo haya una opcion), nunca autoseleccionada "en silencio" mas
  // alla de precargar la lista marcada General por conveniencia - el usuario
  // sigue pudiendo cambiarla. Alcance actual: solo listas base (sin cliente),
  // la resolucion por listas propias del cliente no esta construida todavia.
  list_listaprecio: ListaPrecioCombo[] = [];
  SelectListaControl = new FormControl<ListaPrecioCombo | null>(null, Validators.required);

  constructor(private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private VentasService: VentaServiceService,
    private serviceIni: ServiciosiniService,
    private numeradorService: NumeradorService,
    private loginService: LoginService,
    private turnoService: AbrirturnoService,
    private cajasService: CajasService,
    private sucursalService: SucursalServiceService,
    private tasaService: TasaImpuestoService,
    private listaprecioService: ListaprecioService,
    private notificacion: NotificacionesService,
    private route: ActivatedRoute,
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
      // rechaza 0 (solo null/undefined/''), min(1) si lo hace.
      idCliente: [this.objeto.idCliente, [Validators.required, Validators.min(1)]],
      fecDoc: [new Date(), Validators.required],
      idBodega: this.objeto.idBodega,
      idEstado: this.objeto.idEstado,
      impNeto: this.objeto.impNeto,
      impDescuento: this.objeto.impDescuento,
      impTotal: this.objeto.impTotal,
      observaciones: [this.objeto.observaciones, Validators.required],

      documento: this.objeto.documento,
      serie: this.objeto.serie,
      // nroDocum ya no se maneja localmente: el backend lo asigna (numerador "VENTA"
      // en md_numeradores) en el proximo guardado.
      nroDocum: [this.objeto.nroDocum],
      secuencia: this.objeto.secuencia,
      factura: this.objeto.factura,

      idTurno: this.objeto.idTurno,
      idCaja: null,
      // min(1): arranca en 0 (sin seleccionar) hasta que se resuelva la lista -
      // mismo criterio que idCliente (required no rechaza 0, min(1) si).
      idLista: [this.objeto.idLista ?? 0, [Validators.required, Validators.min(1)]],
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
      //nuevoCodigoBarra: this.fb.array([]),
      logs: this.fb.array([]),
      searchCliente: cliente_filtro,
      detalles: this.fb.array([])
    });

    // Igual que compradirecta: la grilla y varios combos (combo-cliente, articulo-autocomplet)
    // implementan ControlValueAccessor.setDisabledState, asi que formulario.disable() se
    // propaga correctamente con un solo llamado.
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');

    //Subcribir los cambios al seleccionar la lista de precios
    this.SelectListaControl.valueChanges.subscribe(objLista => {
      this.formulario.patchValue({ idLista: objLista?.idLista ?? 0 });
      this.actualizarStockPreciosMasivo();
    });
    this.cargarListasPrecio();

    // Si el usuario cambia la bodega con lineas ya cargadas, se recalcula stock
    // y precio de todas (mismo criterio que compradirecta.actualizarStocksMasivo,
    // pero en ventas tambien se recalcula el precio contra la lista elegida).
    this.SelectBodegasControl.valueChanges.subscribe(() => {
      this.actualizarStockPreciosMasivo();
    });

    //Subcribir los cambios al selecionar la sucursal (aplica en modo Nuevo y Edicion)
    this.SelectSucursalControl.valueChanges.subscribe(objectoSucusal => {
      if (objectoSucusal) {
        //Cargamos bodega de acuerdo a la sucursal seleccionada
        this.list_bodegas = objectoSucusal.list_bodegas!;
        if (this.isEditMode && this.objeto.idBodega) {
          const bodegaExistente = this.list_bodegas.find(b => b.id === this.objeto.idBodega);
          if (bodegaExistente) {
            this.SelectBodegasControl.setValue(bodegaExistente);
          }
        } else {
          const unicaBodega = this.list_bodegas[0];
          if (unicaBodega) {
            this.SelectBodegasControl.setValue(unicaBodega);
            //Asignamos al path
            this.formulario.patchValue({
              idBodega: unicaBodega.id,
            });
          }
        }

        //Cargamos documento de acuerdo a la sucursal
        this.list_documentos = objectoSucusal.documentos!;
        //Cargamos medio de pago
        this.list_mediospago = [...objectoSucusal.mediopago!, PAGO_MIXTO_SENTINEL];

        if (!this.isEditMode) {
          const primerDocum = this.list_documentos[0];
          if (primerDocum) {
            this.SelectdocumentoControl.setValue(primerDocum);

            //Asignamos al path
            this.formulario.patchValue({
              documento: primerDocum.documento,
              serie: primerDocum.serie,
              secuencia: primerDocum.secuencia
            });
          }

          const primermedio = this.list_mediospago[0];
          if (primermedio) {
            this.SelecmediosControl.setValue(primermedio);
          }
        } else {
          // Igual que la bodega arriba: en edicion hay que buscar y seleccionar el
          // documento/medio de pago YA GUARDADOS de la venta (antes no se hacia nada
          // aca, asi que el mat-select de "Documento" y "Forma Pago" quedaban vacios
          // al ver/editar una venta existente).
          if (this.objeto.documento) {
            const documentoExistente = this.list_documentos.find(d => d.documento === this.objeto.documento);
            if (documentoExistente) {
              this.SelectdocumentoControl.setValue(documentoExistente);
            }
          }

          // Un solo medio de pago guardado -> se selecciona directo. Mas de uno
          // (pago mixto) -> se selecciona el sentinel "Pago Mixto" y se precarga
          // la grilla (form-mediopago) con lo ya guardado.
          const detallesPago = this.objeto.detallesPago;
          if (detallesPago && detallesPago.length === 1) {
            const medioExistente = this.list_mediospago.find(m => m.id === detallesPago[0].idMediopago);
            if (medioExistente) {
              this.SelecmediosControl.setValue(medioExistente);
            }
          } else if (detallesPago && detallesPago.length > 1) {
            this.SelecmediosControl.setValue(PAGO_MIXTO_SENTINEL);
            this.lineasPagoIniciales = detallesPago.map(d => ({
              idMediopago: d.idMediopago,
              tipo: d.mediopago?.tipo ?? '',
              valor: Number(d.importe)
            }));
          }
        }


      } else {
        this.list_bodegas = []; // Limpiar si no hay categoría seleccionada
        this.list_documentos = [];
        this.list_mediospago = [];
      }
    });

    //Subcribir los cambios al selecionar el documento
    this.SelectdocumentoControl.valueChanges.subscribe(objDocumento => {
      if (objDocumento) {
        //Asignamos al path
        this.formulario.patchValue({
          documento: objDocumento.documento,
          serie: objDocumento.serie,
          secuencia: objDocumento.secuencia
        });
        //Mostrar/ocultar fecha de vencimiento segun el tipo de documento
        this.mostrarFecVenc = objDocumento.documento === 'Credito';

        // Numero tentativo (no consume el numerador, solo lo previsualiza). Solo
        // aplica en modo Nuevo: en edicion nroDocum ya quedo asignado al crear.
        if (!this.isEditMode) {
          this.previsualizarNumerador(objDocumento.secuencia);
        }
      }
    });

    //Subcribir la seleccion manual de caja (escenario B: sin turno abierto)
    this.SelectCajaUsuarioControl.valueChanges.subscribe(objCaja => {
      this.formulario.patchValue({ idCaja: objCaja?.idCaja ?? null });
    });

    //Subcribir los cambios al selecionar el tipo de descuento
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
        this.objeto = new Ventas();

        this.cargarSucursales();
        this.agregarLineaVacia();
        this.ValidarColumnas(this.defaultdcto);
        this.resolverCajaTurno();
      }
    })

  }

  //Metodo para cargar la venta que viene para edicion/visualizacion
  ModoEdicion(id: number): void {
    console.log("ModoEdicion");
    this.VentasService.getVentaById(id).subscribe({
      next: (data: Ventas) => {
        this.objeto = data;
        this.titulo_form = this.isReadOnly ? 'DETALLE VENTA DIRECTA' : 'ACTUALIZACION VENTA DIRECTA';

        //1. Cargar auditoria del formulario
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

        //2. Cargar la informacion del cabezal
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
          idCaja: data.idCaja,
          idLista: data.idLista ?? 0,
          fecVenc: data.fecVenc,
          impIgreso: data.impIgreso,
          impVuelto: data.impVuelto,
          porcDescuento: data.porcDescuento
        });
        this.formulario.get('nroDocum')?.patchValue(data.nroDocum);
        this.formatearImpIgresoVisible(data.impIgreso);

        // Si cargarListasPrecio() ya resolvio antes que esta llamada, el intento
        // de match que hace alla no encontro nada porque this.objeto.idLista
        // todavia no existia - se reintenta aca ahora que si.
        if (data.idLista && this.list_listaprecio.length) {
          const listaExistente = this.list_listaprecio.find(l => l.idLista === data.idLista);
          if (listaExistente) {
            this.SelectListaControl.setValue(listaExistente);
          }
        }

        // SelecdctoControl (tipo de descuento) nunca se restauraba en edicion -
        // se quedaba siempre en su valor por defecto ("No Aplica"), lo que ademas
        // dejaba "porcDescuento" deshabilitado/oculto sin importar el % real
        // guardado (ver valueChanges de SelecdctoControl en ngOnInit).
        if (data.tipoDcto) {
          this.SelecdctoControl.setValue(data.tipoDcto);
        }
        // "factura" (el campo visible) solo se calcula normalmente via
        // previsualizarNumerador(), que se salta en modo edicion (esa venta ya tiene
        // numero real asignado) - se arma aca directo con serie+nroDocum ya guardados.
        this.formulario.get('factura')?.patchValue(`${data.serie ?? ''}${data.nroDocum ?? ''}`);

        //Cliente ya asignado (bloquea el buscador, igual que onClienteChange)
        this.onClienteChange(data.cliente);

        //Cargamos sucursales (dispara el subscribe de arriba, que ahora sabe que estamos en edicion)
        this.cargarSucursales();

        // "Caja" en modo edicion: NO se debe volver a resolver con resolverCajaTurno()
        // (esa funcion mira el turno ACTIVO del usuario en este momento, no el que
        // uso esta venta cuando se creo) - se resuelve directo desde lo que la venta
        // ya trae guardado (idTurno o idCaja), mostrando siempre el nombre real de la
        // caja de forma solo-lectura (igual que el Escenario A, sin importar cual de
        // los dos escenarios se uso originalmente).
        if (data.idTurno) {
          this.turnoService.getTurnoById(data.idTurno).subscribe({
            next: (turno) => {
              this.tieneTurnoActivo = true;
              this.nombreCajaActiva = turno.caja?.nomCaja || '';

              // Si el turno de esta venta ya esta cerrado, no se debe permitir
              // editarla - se fuerza a solo-lectura (aunque la ruta haya sido
              // /edit/:id) reutilizando el mismo bloqueo total que ya existe para
              // /view/:id, en vez de agregar mas condicionales de "campo editable
              // si..." sueltas por el formulario.
              if (this.isEditMode && turno.status === false) {
                this.isReadOnly = true;
                this.turnoCerrado = true;
                this.titulo_form = 'DETALLE VENTA DIRECTA';
                this.bloquearFormularioSoloLectura();
              }
            }
          });
        } else if (data.idCaja) {
          this.cajasService.getCajaById(data.idCaja).subscribe({
            next: (caja) => {
              this.tieneTurnoActivo = true;
              this.nombreCajaActiva = caja.nomCaja || '';
            }
          });
        }

        // 3. Recorrer detalles
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
            objimpuesto1: {
              id: det.idTasaimp1,
              tasaImpuesto: det.impuesto1,
              porcentaje: 0,
              descripcion: ''
            },
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
          nuevoDetalle.get('search')?.disable(); // Bloquear el buscador, ya tiene articulo
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
        console.error('Error al cargar la venta:', err);
        this.router.navigate(['/ventas']);
      }
    });
  }

  // Deshabilita todo el formulario (misma logica ya usada para /view/:id) - se
  // extrajo aca para poder reutilizarla cuando se detecta que el turno de una
  // venta ya esta cerrado y por lo tanto tampoco se debe permitir editarla.
  private bloquearFormularioSoloLectura(): void {
    this.formulario.disable();
    this.SelectSucursalControl.disable();
    this.SelectBodegasControl.disable();
    this.SelectdocumentoControl.disable();
    this.SelecmediosControl.disable();
    this.SelecdctoControl.disable();
    this.SelectListaControl.disable();
  }

  /*
Receptores
*/
  recibirEstado(estado: any) {
    console.log('El padre recibió la estado:', estado);
    this.formulario.patchValue({
      idEstado: estado.id
    });
    this.actualizarStockPreciosMasivo();
  }

  // Recalcula stock y precio de todas las lineas ya cargadas en la grilla en una
  // sola llamada, cuando cambia bodega/estado/lista de precios - mismo patron
  // (cadena "idArticulo-idCodBarra;...") que compradirecta.actualizarStocksMasivo,
  // pero aca tambien se recalcula el precio (ventadisponiblexbodega en lote) ya
  // que el precio de venta depende de la lista elegida, no solo del articulo.
  actualizarStockPreciosMasivo(): void {
    const idBodega = this.SelectBodegasControl.value?.id;
    const idEstado = this.formulario.get('idEstado')?.value;
    const idLista = this.SelectListaControl.value?.idLista;

    const cadenaArticulos = this.detalles.controls
      .map(f => ({ idA: f.get('idArticulo')?.value, idC: f.get('idCodBarra')?.value }))
      .filter(f => f.idA && f.idC)
      .map(f => `${f.idA}-${f.idC}`)
      .join(';');

    if (!cadenaArticulos || !idBodega || !idEstado) return;

    this.VentasService.actualizarStockPrecios(cadenaArticulos, idBodega, idEstado, idLista || 0).subscribe({
      next: (data: any[]) => {
        data.forEach(info => {
          const fila = this.detalles.controls.find(f =>
            f.get('idArticulo')?.value === info.idarticulo &&
            f.get('idCodBarra')?.value === info.idcodbarra
          );
          if (fila) {
            // precio/porc_tasa1 SI disparan el recalculo reactivo de
            // neto/valorImpuesto1/importeTotal (ver combineLatest en agregarLineaVacia).
            fila.patchValue({
              stock: info.stock,
              precio: info.precio,
              idTasaimp1: info.idimpuesto,
              porc_tasa1: info.porcentaje
            });
            // El validador de stock vive en "cantidad" y lee "stock" de la misma
            // fila, pero Angular solo re-ejecuta un validador cuando el PROPIO
            // control cambia, no cuando cambia un campo hermano - si aca solo se
            // actualizara "stock", una cantidad que quedo sin cobertura (ej. al
            // cambiar a una bodega con menos existencia) no se marcaria invalida
            // hasta que el usuario la tocara de nuevo, dejando guardar una venta
            // sin stock suficiente.
            fila.get('cantidad')?.updateValueAndValidity();
          }
        });
      },
      error: (err) => console.error('Error actualizando stock/precios masivo', err)
    });
  }

  /**
   * Resuelve la caja/turno de la venta segun 2 escenarios:
   * A. El usuario tiene un turno/caja POS abierto (y vigente) -> se toma el
   *    idTurno de ahi (igual que hace venta-pos con ValidacionTurno), la caja
   *    se muestra de solo lectura.
   * B. El usuario no tiene turno abierto, o lo tiene pero esta vencido (ej.
   *    administrador de backoffice) -> se le deja elegir entre las cajas NO
   *    POS asociadas a su usuario (m_cajasxuser), y se guarda idCaja en su
   *    lugar (idTurno queda null). A diferencia de venta-pos/movimientocaja,
   *    aqui el turno POS nunca es obligatorio, por lo que un turno vencido no
   *    bloquea la pantalla: simplemente no se usa como caja de movimiento.
   */
  resolverCajaTurno(): void {
    const usuario = this.loginService.getUsuarioActual();
    if (!usuario) {
      return;
    }

    this.turnoService.ValidacionTurno(usuario.usuario).subscribe({
      next: (data) => {
        if (data.tieneturno && !data.turnoVencido) {
          this.tieneTurnoActivo = true;
          this.nombreCajaActiva = data.nomCaja;
          this.formulario.patchValue({
            idTurno: data.idTurno,
            idCaja: null
          });
        } else {
          this.tieneTurnoActivo = false;
          this.formulario.patchValue({ idTurno: null });
          this.cargarCajasUsuario(usuario.idUsuario);
        }
      },
      error: (err) => {
        console.error('Error (resolverCajaTurno)', err);
        // Si no se puede validar el turno, se deja igual la opcion de elegir caja manualmente.
        this.tieneTurnoActivo = false;
        this.cargarCajasUsuario(usuario.idUsuario);
      }
    });
  }

  cargarCajasUsuario(idUsuario: number): void {
    this.cajasService.porUsuario(idUsuario).subscribe({
      next: (data) => {
        this.list_cajasUsuario = data;
        if (data.length === 1) {
          this.SelectCajaUsuarioControl.setValue(data[0]);
        }
      },
      error: (err) => {
        console.error('Error (cargarCajasUsuario)', err);
      }
    });
  }

  // Carga las listas de precio base (nunca de cliente) disponibles para elegir
  // en el encabezado. Se llama en paralelo a ModoEdicion() (si aplica) - por
  // eso el match contra data.idLista tambien se reintenta alla, cubriendo
  // cualquiera de los dos ordenes posibles en que ambas llamadas resuelvan.
  cargarListasPrecio(): void {
    this.listaprecioService.listCombo().subscribe({
      next: (data) => {
        this.list_listaprecio = data;

        if (this.isEditMode) {
          if (this.objeto.idLista) {
            const listaExistente = this.list_listaprecio.find(l => l.idLista === this.objeto.idLista);
            if (listaExistente) {
              this.SelectListaControl.setValue(listaExistente);
            }
          }
        } else {
          const listaGeneral = this.list_listaprecio.find(l => l.esGeneral) ?? this.list_listaprecio[0];
          if (listaGeneral) {
            this.SelectListaControl.setValue(listaGeneral);
          }
        }
      },
      error: (err) => {
        console.error('Error cargando listas de precio', err);
      }
    });
  }

  /**
   * Muestra el numero de factura tentativo (sin consumir el numerador real).
   * El campo visible en la plantilla es "factura" (serie + numero, ej. "FE1"),
   * nroDocum no tiene input propio pero igual se guarda en el formulario porque
   * se envia en el payload. El numero definitivo se asigna recien al grabar
   * (backend, md_numeradores) - este solo es informativo para el usuario.
   */
  previsualizarNumerador(secuencia: string): void {
    console.log("previsualizarNumerador")
    console.log(secuencia)
    const idEmp = this.loginService.getIdEmpresaActual();
    if (!idEmp || !secuencia) {
      return;
    }
    this.numeradorService.preview(idEmp, secuencia).subscribe({
      next: (data) => {
        const serie = this.formulario.get('serie')?.value || '';
        const fact = `${serie}${data.next_value ?? ''}`;

        this.formulario.get('nroDocum')?.patchValue(data.next_value);
        this.formulario.get('factura')?.patchValue(fact);
      },
      error: (err) => {
        console.error('Error (previsualizarNumerador)', err);
      }
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

  cargarSucursales(): void {
    this.sucursalService.sucursalesxBodegas().subscribe({
      next: (data) => {
        this.list_sucursal = data;
        console.log("cargarSucursales")
        console.log(this.objeto.idSucursalEmp)
        // Si es metodo edicion y tengo una empresa cargada.
        //La busco en la lista que me retorno el API
        if (this.isEditMode && this.objeto.idSucursalEmp) {
          //busco la sucursal por ID
          const sucursalSeleccinada = this.list_sucursal.find(
            sucursal => sucursal.id === this.objeto.idSucursalEmp
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
        const Netototal = (precio || 0) * (cantidad || 0);
        const imp_dcto = Netototal * ((porc_dcto / 100));
        const valorImpu1 = ((Netototal - imp_dcto) || 0) * ((porc_tasa1 / 100) || 0);

        nuevoDetalle.get('neto')?.setValue(Netototal, { emitEvent: false });
        nuevoDetalle.get('valorImpuesto1')?.setValue(valorImpu1, { emitEvent: false });
        nuevoDetalle.get('imp_dcto')?.setValue(imp_dcto, { emitEvent: false });
        nuevoDetalle.get('importeTotal')?.setValue((Netototal - imp_dcto + valorImpu1), { emitEvent: false });

      });
    }
    // añadir al FormGroup general
    this.detalles.push(nuevoDetalle);
    this.dataSource.data = this.detalles.controls as FormGroup[];
  }

  // Cantidad obligatoria y mayor a 0 solo si la fila ya tiene articulo seleccionado
  // (la fila vacia final del grid no debe marcarse en rojo antes de tiempo).
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

  // A diferencia de ajustestock (que solo valida stock cuando el motivo es de salida),
  // una venta siempre resta stock, asi que aca la validacion no depende de ningun signo/motivo.
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
      const idLista = this.formulario.value.idLista;
      //Con el articulo seleccionado se consulta por API , el stock y el precio
      //real (resuelto contra la lista de precios elegida en el encabezado).
      this.serviceIni.stkVentaDisponible(articulo.idArticulo!, articulo.idCodBarra!, idBodega!, idEstado!, idLista).subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            //El api solo debe responder con una sola linea.
            const stockData = data[0];
            console.log(stockData);

            const valorIVA = Number(stockData.precio) * (Number(stockData.porcentaje) / 100);
            const total = Number(stockData.precio) + valorIVA;

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
              // crearDetalleForm() llama al control "referencia" (asi lo espera el
              // backend), no "nombreArticulo"/"codigoArticulo" - esos dos nombres no
              // existen como control en el FormGroup, asi que patchValue los ignoraba
              // silenciosamente y referencia se quedaba vacia para siempre (aunque el
              // input SI mostrara el articulo bien, via el control "search" de abajo).
              referencia: articulo.nomArticulo,
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

  get totalNeto(): number {
    // 1. Obtenemos el array de valores (incluyendo los campos disabled como 'neto')
    const todasLasFilas = this.detalles.getRawValue();

    // 2. Sumamos el campo 'neto' de cada objeto en el array
    return todasLasFilas.reduce((acumulado, fila) => {
      return acumulado + (Number(fila.neto) || 0);
    }, 0);
  }

  get totalFinal(): number {
    // 1. Obtenemos el array de valores (incluyendo los campos disabled como 'neto')
    const todasLasFilas = this.detalles.getRawValue();

    // 2. Sumamos el campo 'neto' de cada objeto en el array
    return todasLasFilas.reduce((acumulado, fila) => {
      return acumulado + (Number(fila.importeTotal) || 0);
    }, 0);
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
   * escribe - mismo patron ya usado en "Base" (form-turnos) e "Importe"
   * (form-movimientocaja). El FormControl (impIgreso) siempre guarda el numero
   * real sin puntos - el punto solo se aplica al valor mostrado en el input.
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
    return todasLasFilas.reduce((acumulado, fila) => {
      return acumulado + (Number(fila.valorImpuesto1) || 0);
    }, 0);
  }

  get totalDcto(): number {
    // 1. Obtenemos el array de valores (incluyendo los campos disabled como 'neto')
    const todasLasFilas = this.detalles.getRawValue();

    // 2. Sumamos el campo 'neto' de cada objeto en el array
    return todasLasFilas.reduce((acumulado, fila) => {
      return acumulado + (Number(fila.imp_dcto) || 0);
    }, 0);
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
    console.log("enviarFormulario")
    const fecha_envio = new Date()
    this.intentoGuardar = true; // A partir de aca se pintan en rojo los campos obligatorios vacios (ej. combo-cliente)

    this.formulario.patchValue({
      idEmp: 1,
      idSucursalEmp: this.SelectSucursalControl.value?.id,
      idBodega: this.SelectBodegasControl.value?.id,
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
      // en 0 - el descuento por linea (imp_dcto) si se guardaba bien en el detalle,
      // pero nunca se sumaba hacia la cabecera pese a que el getter totalDcto ya
      // existia para esto.
      impDescuento: this.totalDcto,
      // Se resuelve aca (no se deja el valor crudo que haya quedado en el control)
      // para que un "Valor Ingreso" vacio no rompa el guardado - se asume pago
      // exacto cuando el cajero no lo toca, o cuando el medio no es Efectivo.
      impIgreso: this.impIngresoEfectivo,
      impVuelto: this.vuelto,
      // "documento" (Contado/Credito) ya lo patchea SelectdocumentoControl.valueChanges
      // al elegir el tipo de documento - antes aca se pisaba con el literal fijo
      // 'venta', asi que TODA venta guardada terminaba con documento='venta' en vez
      // del tipo real, y por eso el combo "Documento" nunca podia re-seleccionarse
      // al editar (ningun item de m_documventas se llama 'venta').
      vista: 'VentaDirect',
      fechaMod: fecha_envio.toISOString()
    });
    console.log("Json original");
    console.log(this.formulario.getRawValue());

    this.formulario.markAllAsTouched(); // Pinta en rojo todos los campos obligatorios vacios (ej. Observacion)
    // idLista vive dentro de formulario, pero SelectListaControl (el mat-select
    // que el usuario realmente ve) es un control aparte - markAllAsTouched()
    // no lo toca, asi que su propio <mat-error> no se pintaria sin esto.
    this.SelectListaControl.markAsTouched();

    // idCliente no tiene un <mat-error> visible propio (combo-cliente es un
    // componente aparte, se pinta via [mostrarError]), asi que ademas se avisa
    // con un mensaje explicito para que quede claro por que no se pudo guardar.
    if (this.formulario.get('idCliente')?.invalid) {
      this.notificacion.showError('Debes seleccionar un cliente antes de guardar.');
      return;
    }

    // Igual que idCliente: SelectCajaUsuarioControl vive fuera de this.formulario,
    // asi que formulario.invalid no lo detecta - se valida aparte. Solo aplica en
    // escenario B (sin turno activo); con turno activo la caja viene resuelta sola.
    if (!this.tieneTurnoActivo) {
      this.SelectCajaUsuarioControl.markAsTouched();
      if (this.SelectCajaUsuarioControl.invalid) {
        this.notificacion.showError('Debes seleccionar una caja antes de guardar.');
        return;
      }
    }

    // La fila vacia final del grid siempre existe (idArticulo 0/null); se exige
    // al menos una linea con articulo real antes de permitir grabar.
    const hayArticulos = this.detalles.controls
      .some((fila: any) => fila.value.idArticulo !== 0 && fila.value.idArticulo !== null);
    if (!hayArticulos) {
      this.notificacion.showError('Debes agregar al menos un articulo antes de guardar.');
      return;
    }

    // Igual que idCliente/caja: mensaje explicito para que quede claro por que
    // no se pudo guardar (el <mat-error> de la fila puede pasar desapercibido).
    const hayStockInsuficiente = this.detalles.controls
      .some((fila: any) => fila.get('cantidad')?.hasError('stockInsuficiente'));
    if (hayStockInsuficiente) {
      this.notificacion.showError('Hay articulos con cantidad mayor al stock disponible.');
      return;
    }

    if (this.formulario.invalid) {
      return; // El resto de los campos obligatorios ya quedaron en rojo arriba
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

    const sumaPagos = Math.round(detallesPago.reduce((acc, d) => acc + (d.importe || 0), 0) * 100) / 100;
    if (Math.abs(sumaPagos - this.totalFinal) > 0.01) {
      this.notificacion.showError('La suma de los medios de pago no coincide con el total de la venta.');
      return;
    }
    console.log("Paso Json");

    // El log de auditoria se agrega solo cuando ya se paso todas las validaciones,
    // justo antes de armar el JSON a enviar - si se agregaba antes de estas
    // validaciones, cada intento fallido (cliente/articulos/etc. faltantes) dejaba
    // una entrada extra en el FormArray sin que resetCampos() la limpiara nunca
    // (esa limpieza solo corre despues de un guardado exitoso), acumulando varias
    // entradas de log para una sola transaccion real.
    this.agregarLogAuditoria();

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

    if (this.isEditMode) {
      console.log("Editar")
      this.VentasService.edit(this.objeto.idTrans!, jsonParaAPI).subscribe({
        next: (venta) => {
          this.notificacion.showSuccess('Venta actualizada con éxito!');
          this.router.navigate(['/ventas']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar la venta.');
        }
      });
    } else {
      console.log("Nuevo")
      this.VentasService.save(jsonParaAPI).subscribe({
        next: (venta) => {
          this.notificacion.showSuccess('Venta guardada con éxito!');
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
    const idBodega = this.formulario.value.idBodega;
    const idEstado = this.formulario.value.idEstado;
    // idTurno/idCaja ya quedaron resueltos por resolverCajaTurno() (escenario A o B)
    // al entrar al formulario - se guardan aca y se reponen despues del reset para
    // no tener que volver a consultar el turno/las cajas del usuario en cada venta.
    const idTurno = this.formulario.value.idTurno;
    const idCaja = this.formulario.value.idCaja;
    // Misma logica: SelectListaControl (standalone) sobrevive al resetForm(),
    // pero el campo idLista del formulario si queda en blanco - se repone
    // desde el control en vez de volver a consultar/re-seleccionar la lista.
    const idLista = this.formulario.value.idLista;

    this.objeto = new Ventas();
    this.formDirective.resetForm();

    // El log de auditoria es por-transaccion: si no se limpia aca, la siguiente
    // venta arrastraria las entradas de la venta anterior ya grabada.
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    const detalle = this.formulario.get('detalles') as FormArray;
    detalle.clear();
    this.agregarLineaVacia();

    this.formulario.get('idBodega')?.patchValue(idBodega);
    this.formulario.get('idEstado')?.patchValue(idEstado);
    this.formulario.patchValue({ idTurno, idCaja, idLista });

    // resetForm() sin argumentos deja fecDoc/fecVenc en blanco (no vuelve al valor
    // inicial de la construccion del formulario) - se reponen a la fecha de hoy.
    const hoy = new Date();
    this.formulario.patchValue({ fecDoc: hoy, fecVenc: hoy });

    // porcDescuento (control deshabilitado por defecto) tambien queda en null tras
    // el reset en vez de su valor por defecto 0 - se repone explicitamente.
    this.formulario.patchValue({ porcDescuento: 0 });

    // Recien empieza un registro nuevo: todavia no se intento guardar, asi que no
    // deben verse en rojo los campos obligatorios vacios (ver mostrarError).
    this.intentoGuardar = false;

    // El cliente queda bloqueado tras seleccionarlo (onClienteChange lo deshabilita);
    // resetForm() no lo reactiva solo, hay que desbloquearlo explicitamente para
    // poder cargar el cliente de la siguiente venta.
    this.formulario.get('searchCliente')?.enable();
    this.formulario.patchValue({
      idCliente: 0,
      searchCliente: { idCliente: 0, idPersona: 0, codTit: '', nombreCompleto: '' } as ClienteSearch
    });

    // documento/serie/secuencia solo se patchean dentro del valueChanges de
    // SelectdocumentoControl (standalone, fuera de "formulario"); resetForm() los
    // deja en blanco y como el control no cambio de valor ese suscriptor no vuelve
    // a disparar solo - se repone a mano, igual que el numerador tentativo debajo
    // (que ademas depende de "serie" ya repuesto para armar bien el texto de "factura").
    if (this.SelectdocumentoControl.value) {
      const objDocumento = this.SelectdocumentoControl.value;
      this.formulario.patchValue({
        documento: objDocumento.documento,
        serie: objDocumento.serie,
        secuencia: objDocumento.secuencia
      });
      this.previsualizarNumerador(objDocumento.secuencia);
    }

    this.lineasPagoMixto = [];
    this.lineasPagoIniciales = [];
  }


}
