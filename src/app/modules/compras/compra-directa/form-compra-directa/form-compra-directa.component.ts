import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { MatTableDataSource } from '@angular/material/table';
import { AjusteStockInfoArticulos } from '../../../../core/interfaces/Bodega/AjusteStockInfoArticulos';
import { Compra } from '../../../../core/models/Compras/Compra';
import { CompraDetalle } from '../../../../core/models/Compras/CompraDetalle';
import { ArticuloSearch } from '../../../../core/models/Bodega/ArticuloSearch';
import { ArticuloAutocompletComponent } from '../../../resources/articulo-autocomplet/articulo-autocomplet.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ComboProveedorComponent } from '../../../resources/combo-proveedor/combo-proveedor.component';
import { combineLatest, startWith } from 'rxjs';
import { CompraDisponible } from '../../../../core/interfaces/Compras/CompraDisponible';
import { SucursalServiceService } from '../../../../core/services/General/sucursal-service.service';
import { ProveedorSearch } from '../../../../core/interfaces/Compras/ProveedorSearch';
import { TasasCombo } from '../../../../core/interfaces/Impuestos/TasasCombo';
import { TasaImpuestoService } from '../../../../core/services/impuestos/tasa-impuesto.service';
import { ComprasService } from '../../../../core/services/Compras/compras.service';
import { ServiciosiniService } from 'src/app/core/services/core/serviciosini.service';
import { SucursalCombo } from 'src/app/core/interfaces/Core/SucursalCombo';
import { BodegaCombo } from 'src/app/core/interfaces/Bodega/BodegaCombo';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { CodigosBarra } from 'src/app/core/models/Bodega/CodigosBarra';
import { ModalCodigobarraComponent } from '../modal-codigobarra/modal-codigobarra.component';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';
import { ComboLoteComponent } from 'src/app/modules/resources/combo-lote/combo-lote.component';
import { LoteDisponible } from 'src/app/core/interfaces/Bodega/LoteDisponible';
import { ArticuloService } from 'src/app/core/services/Bodega/articulo.service';
import { ConfcomprasService } from 'src/app/core/services/Compras/confcompras.service';

@Component({
  selector: 'form-compra-directa',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatDialogModule, ArticuloAutocompletComponent, MatDatepickerModule,
    MatCheckboxModule, MatButtonToggleModule, ComboProveedorComponent, ComboLoteComponent],
  templateUrl: './form-compra-directa.component.html',
  styleUrl: './form-compra-directa.component.scss'
})
export class FormCompraDirectaComponent {

  //Variables Generales
  formulario!: FormGroup;
  objeto!: Compra;
  objeto_resultado!: CodigosBarra;
  titulo_form: string = 'REGISTRO DE COMPRA DIRECTA';
  isEditMode: boolean = false; //Se define si el modo es nuevo o edicion
  isReadOnly: boolean = false; //Se define si el modo es solo lectura (ver)

  // Pestaña actualmente seleccionada del mat-tab-group (0 = Datos Generales, 1 = Recepcion y Totales)
  selectedTabIndex = 0;
  // Campos de cabecera agrupados por la pestaña donde viven, para poder saltar
  // automaticamente a la primera pestaña con un campo obligatorio faltante al guardar.
  private readonly camposPorPestana: string[][] = [
    ['nroDocum', 'fecDoc', 'detalles', 'searchProveedor'],   // Pestaña 0: Datos Generales
    ['remito', 'observaciones'],          // Pestaña 1: Recepcion y Totales
  ];

  //tabla de articulos
  detalle: CompraDetalle[] = [];
  dataSource = new MatTableDataSource<FormGroup>();
  // Stock/Costo Anterior ya no son columnas propias: se muestran como etiqueta
  // debajo del nombre del articulo (ver celda "id" en el HTML).
  todasLasColumnas: string[] = ['position', 'id', 'Lote', 'cantidad', 'costo', 'porc_dcto', 'impuesto1', 'neto', 'imp_dcto', 'imp1', 'total','markup','precioventa'];
  displayedColumns: string[] = [];

  // No existe un flag de "la empresa maneja lotes": se deriva de si al menos
  // un articulo del catalogo lo maneja (GET /bodega/articulos/manejaLotes).
  // Arranca en false (columna oculta) hasta que se confirme lo contrario, para
  // no mostrarla un instante y luego ocultarla.
  empresaManejaLotes: boolean = false;

  // Columna "Precio Venta": solo se muestra si la empresa activo
  // m_confcompras.actPrecioCompra (ver cargarConfiguracionCompras).
  mostrarPrecioVenta: boolean = false;

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

  //Para habilitar o deshabilitar el autoCompletar del articulo
  isModalClosing = true;

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;

  // combo-proveedor tiene su propio FormControl interno (ControlValueAccessor),
  // separado del "searchProveedor" de este formulario - formulario.markAllAsTouched()
  // no lo alcanza. Se le avisa directo (ver enviarFormulario) para que muestre
  // su propio error visual.
  @ViewChild(ComboProveedorComponent) comboProveedor!: ComboProveedorComponent;

  //Se refrencia el autoCompletar de articulos para cambiar de foco una vez se use.
  @ViewChildren('inputCosto') inputsCostos!: QueryList<ElementRef>;

  // Mismo mecanismo que "Costo": referencia a los inputs de "Precio Venta"
  // para aplicarles el formato visual ###.###.###,00 sin tocar el FormControl.
  @ViewChildren('inputPrecioVenta') inputsPrecioVenta!: QueryList<ElementRef>;

  // Mismo mecanismo, aplicado a "Markup (%)" (ver onFocusMarkup/onBlurMarkup).
  @ViewChildren('inputMarkup') inputsMarkup!: QueryList<ElementRef>;

  // Capturamos todos los triggers de la tabla
  @ViewChildren(ArticuloAutocompletComponent) articulosComps!: QueryList<ArticuloAutocompletComponent>;


  constructor(private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private compraService: ComprasService,
    private serviceIni: ServiciosiniService,
    private sucursalService: SucursalServiceService,
    private tasaService: TasaImpuestoService,
    private articuloService: ArticuloService,
    private confcomprasService: ConfcomprasService,
    private notificacion: NotificacionesService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router) {
    this.objeto = new Compra();
  }


  ngOnInit() {
    console.log(this.objeto);

    let proveedor_filtro: ProveedorSearch = {
      idProveedor: 0,
      idPersona: 0,
      codTit: '',
      nombreCompleto: ''
    }
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      idTrans: this.objeto.idTrans,
      idEmp: this.objeto.idEmp,
      idSucursal: this.objeto.idSucursal,
      idProveedor: this.objeto.idProveedor,
      // nroDocum ya no se maneja localmente: el backend lo asigna (numerador "COMPRA"
      // en md_numeradores) en el proximo guardado.
      nroDocum: [this.objeto.nroDocum],
      fecDoc: [new Date(), Validators.required],
      remito: [this.objeto.remito, Validators.required],
      status: this.objeto.status,
      ingresaBodega: [this.objeto.ingresaBodega, Validators.required],
      idBodega: this.objeto.idBodega,
      idEstado: this.objeto.idEstado,
      impNeto: this.objeto.impNeto,
      impDescuento: this.objeto.impDescuento,
      impTotal: this.objeto.impTotal,
      observaciones: [this.objeto.observaciones],
      impuesto1: this.objeto.impuesto1,
      valorImpuesto1: this.objeto.valorImpuesto1,
      impuesto2: this.objeto.impuesto2,
      valorImpuesto2: this.objeto.valorImpuesto2,
      impuesto3: this.objeto.impuesto3,
      valorImpuesto3: this.objeto.valorImpuesto3,
      documento: this.objeto.documento,
      vista: this.objeto.vista,
      fechaMod: this.objeto.fechaMod,
      // Solo indica como se digita el costo en ESTA compra (neto o con IVA
      // incluido) - td_compras.costo_unit de cada linea sigue siendo siempre
      // neto, esto no lo cambia. Ver cargarEstadoPorDefecto/agregarLineaVacia.
      costoIncluyeIva: [this.objeto.costoIncluyeIva || false],
      detalles: this.fb.array([]),
      nuevoCodigoBarra: this.fb.array([]),
      // Lotes pendientes (reservados, aun no existen en m_lotes) creados en esta
      // edicion via combo-lote. Se materializan solo si se guarda la compra.
      nuevosLotes: this.fb.array([]),
      logs: this.fb.array([]),
      // proveedor_filtro (mas abajo) siempre es un objeto no-null con
      // idProveedor:0 como sentinela de "sin elegir" - Validators.required
      // nunca lo detectaria (un objeto no es "vacio" para Angular). Se valida
      // el idProveedor del propio objeto en su lugar.
      searchProveedor: [proveedor_filtro, this.validarProveedorSeleccionado]
    });

    // Cuando cambia el toggle de cabecera "Sin IVA"/"Con IVA", se recalcula
    // como se MUESTRA el costo ya tecleado en cada linea (costoIngresado) -
    // costoUnit (el neto real, ya calculado) no se toca para nada. emitEvent:
    // false a proposito: si emitiera, dispararia la suscripcion inversa de
    // cada linea (costoIngresado->costoUnit, ver agregarLineaVacia) y
    // reinterpretaria el numero ya tecleado bajo el modo nuevo, pisando el
    // costo neto real - justo lo que NO debe pasar al cambiar el toggle.
    this.formulario.get('costoIncluyeIva')?.valueChanges.subscribe((incluyeIva) => {
      this.detalles.controls.forEach(fila => {
        const costoUnit = fila.get('costoUnit')?.value || 0;
        const tasa = fila.get('objimpuesto1')?.value?.porcentaje || 0;
        const costoMostrado = incluyeIva ? costoUnit * (1 + tasa / 100) : costoUnit;
        fila.get('costoIngresado')?.setValue(costoMostrado, { emitEvent: false });
      });
      this.formatearCostosVisibles();
    });

    // No se usa [readonly] por input (a diferencia de otras CRUDs): esta grilla dinamica
    // tiene varios componentes propios (combo-proveedor, articulo-autocomplet) que ya
    // implementan ControlValueAccessor.setDisabledState, asi que formulario.disable()
    // se propaga correctamente a todos ellos con un solo llamado.
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');

    // Se dispara aparte de la rama nuevo/edicion (aplica a las dos) - una vez
    // llega la respuesta, se recalculan las columnas visibles por si ya se
    // habian calculado antes con el valor por defecto (false).
    this.articuloService.existeArticuloConLote().subscribe({
      next: (valor) => {
        this.empresaManejaLotes = valor;
        this.ValidarColumnas();
      },
      error: (err) => console.error('Error validando si la empresa maneja lotes', err)
    });

    // Idem para "Precio Venta": la columna se muestra o no segun la configuracion
    // vigente de la empresa (m_confcompras.actPrecioCompra), en ambos modos
    // (nuevo/edicion). Solo en modo Nuevo, ademas, se toma el estado por defecto
    // (ver cargarConfiguracionCompras).
    this.cargarConfiguracionCompras();

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
        this.objeto = new Compra();

        this.formulario.get('ingresaBodega')?.patchValue(false);
        this.cargarImpuestos();
        this.agregarLineaVacia();
        this.ValidarColumnas();
        this.cargarSucursales();


        //Subcribir los cambios al selecionar la empresa
        this.SelectSucursalControl.valueChanges.subscribe(objectoSucusal => {
          if (objectoSucusal) {
            this.list_bodegas = objectoSucusal.list_bodegas!;
            const unicaBodega = this.list_bodegas[0];
            this.SelectBodegasControl.setValue(unicaBodega);
            this.formulario.patchValue({
              idBodega: unicaBodega.id
            });
          } else {
            this.list_bodegas = []; // Limpiar si no hay categoría seleccionada
          }
        });
      }
    })



    //Subcribir la grilla de impuestos
  }

  //Metodo para cargar la categoria , que viene para edicion
  ModoEdicion(id: number): void {
    console.log("ModoEdicion");
    this.compraService.getCompraById(id).subscribe(
      (data: Compra) => {
        // Cargar la data de la categoría en el formulario
        this.objeto = data;

        this.titulo_form = this.isReadOnly ? 'DETALLE COMPRA' : 'ACTUALIZACION COMPRA';
        //1. Cargar auditoria del formulario
        //Obtener la referencia al FormArray que ya existe en tu FormGroup principal
        const logsFormArray = this.formulario.get('logs') as FormArray;

        //Limpiar el array por si acaso había algo previo (importante en ediciones)
        logsFormArray.clear();

        // Poblar con la data que viene de PostgreSQL
        if (this.objeto.logs?.length) {
          this.objeto.logs.forEach((log: Auditoria) => {
            logsFormArray.push(this.fb.group({
              operacion: [log.operacion],
              usuario_mod: [log.usuario_mod],
              fecha_mod: [log.fecha_mod]
            }));
          });
        }

        //2. Cargar la informacion del cabezal
        this.formulario.get('idTrans')?.patchValue(data.idTrans);
        this.formulario.get('nroDocum')?.patchValue(data.nroDocum);
        this.formulario.get('idSucursal')?.patchValue(data.bodega.idSucursal);
        this.formulario.get('idBodega')?.patchValue(data.idBodega);
        this.formulario.get('idProveedor')?.patchValue(data.idProveedor);
        this.formulario.get('status')?.patchValue(data.status === 'B' ? 'Borrador' :
          data.status === 'F' ? 'Finalizado' :
            data.status === 'C' ? 'Cancelado' : 'N/A',);
        this.formulario.get('fecDoc')?.patchValue(data.fecDoc);
        this.formulario.get('remito')?.patchValue(data.remito);
        this.formulario.get('idEstado')?.patchValue(data.idEstado);
        this.formulario.get('observaciones')?.patchValue(data.observaciones);
        // emitEvent:false - a esta altura "detalles" todavia esta vacio (se
        // llena mas abajo), no hay nada que redisplayar todavia; la suscripcion
        // inversa (ver ngOnInit) es solo para cuando el usuario cambia el
        // toggle DESPUES de que la grilla ya esta cargada.
        this.formulario.get('costoIncluyeIva')?.patchValue(data.costoIncluyeIva || false, { emitEvent: false });
        this.formulario.get('detalles')?.patchValue(data.detalles);

        //Cargarmos status al controlador del combo
        this.SelecStatusControl.setValue(this.formulario.get('status')?.value);
        //Cargamos impuestos
        this.cargarImpuestos();
        //Cargamos sucursales
        this.cargarSucursales();
        //Creamos proveedor y lo asignamos al autocompletar
        let proveedor: ProveedorSearch = {
          idProveedor: data.idProveedor,
          idPersona: 0,
          codTit: data.proveedor.codTit,
          nombreCompleto: data.proveedor.nombreCompleto
        }
        this.onProveedorChange(proveedor);


        // 3. Recorrer el nivel de "detalles" para asignar en el formulario
        const detallesArray = this.detalles;
        detallesArray.clear();
        data.detalles.forEach((det: any) => {

          //Objecto impusto
          let detalleImpuesto: TasasCombo = {
            id: det.detalleimpuesto1.id,
            tasaImpuesto: det.detalleimpuesto1.tasaImpuesto,
            porcentaje: det.detalleimpuesto1.porcentaje,
            descripcion: det.detalleimpuesto1.descripcion
          }

          // Simular el objeto stockData que espera crearDetalleForm
          // Asegúrate de mapear los nombres de campos de tu modelo de API a los del formulario
          let stockData: CompraDisponible = {
            idArticulo: det.idArticulo,
            idCodBarra: det.idCodBarra,
            codArticulo: det.codigoArticulo || '',
            nomArticulo: det.refCompras || '',
            stock: det.stock || 0,
            ubicacion: '',
            idLote: det.idLote,
            costo: det.costanterior,
            neto: det.costoTotal,
            objimpuesto1: detalleImpuesto,
            impuesto1: det.impuesto1,
            tasaimpuesto1: det.idTasaimp1,
            valor_impu1: det.valorImpuesto1,
            total: det.importeTotal
          };

          //Se valida si el objecto det.articulo viene vacio. Si viene vacio 
          //Es porque el codigo de barra a un no se ha creado en el sistema.
          let articuloFiltro: ArticuloSearch = {
            idArticulo: det.idArticulo,
            idCodBarra: det.idCodBarra,
            codArticulo: det.articulo == null ? '' : det.articulo.codArticulo,
            nomArticulo: det.articulo == null ? '' : det.articulo.nomArticulo
          };


          if (!det.articulo && data.nuevoCodigoBarra) {
            console.log("******************")
            console.log(data.nuevoCodigoBarra)
            console.log(det)
            const articuloNuevoCodigo = data.nuevoCodigoBarra.find(obj =>
              obj.idArticulo === det.idArticulo && obj.idCodBarra === det.idCodBarra
            );
            console.log("******************")
            if (articuloNuevoCodigo) {
              console.log("-------------------")
              console.log(articuloNuevoCodigo)
              // Asignamos los valores a la linea correspondiente
              articuloFiltro.codArticulo = articuloNuevoCodigo.codBarra;
              articuloFiltro.nomArticulo = articuloNuevoCodigo.nomBarra;
            }
          }


          // 3. Crear el FormGroup usando tu método existente
          // Esto activará automáticamente los .valueChanges y calculos
          const nuevoDetalle = this.crearDetalleForm(stockData, det.linea, articuloFiltro);

          // costoIngresado (lo que se muestra/edita) se calcula UNA VEZ segun
          // como se cargo esta compra (data.costoIncluyeIva, ya patcheado
          // arriba) - costoUnit (det.costoUnit) sigue siendo siempre el neto
          // real. Estas lineas cargadas via ModoEdicion no llevan la
          // suscripcion reactiva de agregarLineaVacia, asi que este calculo es
          // estatico, igual criterio que el resto de los campos de este patchValue.
          const incluyeIva = this.formulario.get('costoIncluyeIva')?.value;
          const tasaLinea = detalleImpuesto.porcentaje || 0;
          const costoIngresadoInicial = incluyeIva
            ? (det.costoUnit || 0) * (1 + tasaLinea / 100)
            : (det.costoUnit || 0);

          // Markup implicito de esta linea ya guardada (costo con IVA vs
          // Precio Venta grabado) - solo para MOSTRARLO al abrir la compra, no
          // viene resuelto por config aca (esta linea no pasa por
          // onArticuloChange). null si no tiene Precio Venta (nada que mostrar).
          const costoConIvaLinea = (det.costoUnit || 0) * (1 + tasaLinea / 100);
          const porcMarkupInicial = det.impPrecioVta && costoConIvaLinea > 0
            ? Math.round(((det.impPrecioVta / costoConIvaLinea) - 1) * 100 * 100) / 100
            : null;

          // 4. Seteamos los valores específicos de la edición que no son 0
          nuevoDetalle.patchValue({
            costoUnit: det.costoUnit,
            costoIngresado: costoIngresadoInicial,
            impPrecioVta: det.impPrecioVta || 0,
            porcMarkup: porcMarkupInicial,
            cantidad: det.cantidad,
            costoTotal: det.costoTotal,
            importeTotal: det.importeTotal,
            valorImpuesto1: det.valorImpuesto1,
            idLote: det.idLote,
            manejaLote: det.articulo?.manejaLote || false
          });
          nuevoDetalle.get('idLote')?.updateValueAndValidity();

          // IMPORTANTE: Bloquear el buscador si ya tiene artículo
          nuevoDetalle.get('search')?.disable();

          detallesArray.push(nuevoDetalle);
        });

        // 3.1. Actualizar la fuente de datos de la tabla
        this.dataSource.data = detallesArray.controls as FormGroup[];

        // 4. Recorrer el nivel de "nuevoCodigoBarra" para asignar en el formulario
        data.nuevoCodigoBarra.forEach((nuevoscodigos: any) => {
          console.log(nuevoscodigos)
          //Objecto Nuevos codigos de barra
          let nuevoscodigosbarra: CodigosBarra = {
            idCodBarra: nuevoscodigos.idCodBarra,
            idArticulo: nuevoscodigos.idArticulo,
            codBarra: nuevoscodigos.codBarra,
            nomBarra: nuevoscodigos.nomBarra,
            estado: true,
            stock: 0,
            movimientos: 0,
            registro_nuevo: false
          }

          this.agregarCodigoBarraAlArray(nuevoscodigosbarra, nuevoscodigos.linea);
        })

        // 5. Actualizar informacion de stock y costos - SOLO si la compra sigue
        // en Borrador. Una compra Finalizada ya impacto stock/costos de verdad
        // (sp_compradirecta): el "stock"/"costanterior" que trae cada linea
        // (det.stock/det.costanterior, ya cargados arriba en el paso 3) es el
        // valor HISTORICO real con el que se hizo esa compra, y no debe
        // pisarse con el stock/costo actual - eso es lo que pasaba antes (bug
        // reportado: al ver/editar una compra ya realizada, la grilla mostraba
        // el stock de HOY, no el de cuando se compro). Una compra en Borrador
        // si conviene refrescarla, porque todavia no se ha decidido nada y el
        // stock/costo pudo cambiar desde que se guardo el borrador.
        if (data.status === 'B') {
          this.actualizarStocksMasivo();
        }
        //6. agregar linea vacia (solo si se puede seguir editando) y validar columnas a mostrar
        if (!this.isReadOnly) {
          this.agregarLineaVacia();
        }
        this.ValidarColumnas();
        this.formatearCostosVisibles();
        this.formatearPrecioVentaVisibles();
        this.formatearMarkupVisibles();

        if (this.isReadOnly) {
          this.formulario.disable();
          this.SelectSucursalControl.disable();
          this.SelectBodegasControl.disable();
          this.SelectImpuestosControl.disable();
          this.SelecStatusControl.disable();
        }


        //Subcribir los cambios al selecionar la empresa
        this.SelectSucursalControl.valueChanges.subscribe(objectoSucusal => {
          if (objectoSucusal) {
            this.list_bodegas = objectoSucusal.list_bodegas!;
            //Evento Editar
            if (this.isEditMode && this.objeto.idSucursal) {
              //Buscar la bodega correspondiente
              const buscarbodega = this.list_bodegas.find(
                bodega => bodega.id === this.objeto.idBodega
              );
              if (buscarbodega) {
                this.SelectBodegasControl.setValue(buscarbodega);
              }
              //Evento Nuevo
            } else {
              const unicaBodega = this.list_bodegas[0];
              this.SelectBodegasControl.setValue(unicaBodega);
              this.formulario.patchValue({
                idBodega: unicaBodega.id
              });
            }


          } else {
            this.list_bodegas = []; // Limpiar si no hay categoría seleccionada
          }
        });
      },
      error => {
        console.error('Error al cargar la compra:', error);
        // Opcional: Redirigir si el ID es inválido o no existe
        this.router.navigate(['/compras']);
      }
    );
  }

  /*
  Receptores
  */
  // Trae la configuracion de Compras > Configuración una sola vez y aplica sus
  // dos efectos:
  // 1. "Precio Venta" (columna): se muestra/oculta segun actPrecioCompra, en
  //    ambos modos (nuevo/edicion) - igual criterio que empresaManejaLotes.
  // 2. Estado de mercancia por defecto: el usuario ya no lo elige (antes via
  //    combo-estadostock en "Recepcion y Totales") - solo aplica a compras
  //    NUEVAS; en edicion/vista se conserva el idEstado historico ya cargado
  //    (ver ModoEdicion) aunque el default de la empresa haya cambiado despues.
  cargarConfiguracionCompras(): void {
    this.confcomprasService.getConfCompras().subscribe({
      next: (conf) => {
        this.mostrarPrecioVenta = conf.actPrecioCompra;
        this.ValidarColumnas();

        if (!this.isEditMode) {
          if (conf.idEstadoComp == null) {
            this.notificacion.showError(
              'Falta configurar el estado de mercancía por defecto en Compras > Configuración antes de registrar una compra.'
            );
          } else {
            this.formulario.patchValue({ idEstado: conf.idEstadoComp });
          }
        }
      },
      error: (err) => console.error('Error cargando la configuración de compras', err)
    });
  }

  onProveedorChange(proveedor: ProveedorSearch) {
    console.log('onProveedorChange:', proveedor);
    if (proveedor != null) {
      this.formulario.patchValue({
        idProveedor: proveedor.idProveedor,
        searchProveedor: proveedor
      });
      this.formulario.get('searchProveedor')?.disable();
    } else {
      this.formulario.get('searchProveedor')?.enable();
      this.formulario.patchValue({
        idProveedor: 0,
        searchProveedor: proveedor
      });
    }


    //fila.get('search')?.disable(); //Se bloque la primera columna.
  }

  cargarSucursales(): void {
    this.sucursalService.sucursalesxBodegas().subscribe({
      next: (data) => {
        this.list_sucursal = data;
        console.log("cargarSucursales")
        console.log(this.objeto.idSucursal)
        // Si es metodo edicion y tengo una empresa cargada.
        //La busco en la lista que me retorno el API
        if (this.isEditMode && this.objeto.idSucursal) {
          //busco la sucursal por ID
          const sucursalSeleccinada = this.list_sucursal.find(
            sucursal => sucursal.id === this.objeto.idSucursal
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

  cargarImpuestos(): void {
    this.tasaService.ListCombos().subscribe({
      next: (data) => {
        this.list_impuestos = data;
        const unicaSucursal = this.list_impuestos[0];
        this.SelectImpuestosControl.setValue(unicaSucursal);
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
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
    let stockData: CompraDisponible = {
      idArticulo: 0,
      idCodBarra: 0,
      codArticulo: '',
      nomArticulo: '',
      stock: 0,
      ubicacion: '',
      idLote: '',
      costo: 0,
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
    const costoCtrl = nuevoDetalle.get('costoUnit');
    const costoIngresadoCtrl = nuevoDetalle.get('costoIngresado');
    const cantidadCtrl = nuevoDetalle.get('cantidad');
    const impuesto1Ctrl = nuevoDetalle.get('objimpuesto1');
    const dctoCtrl = nuevoDetalle.get('porc_dcto');
    const precioVentaCtrl = nuevoDetalle.get('impPrecioVta');
    const porcMarkupCtrl = nuevoDetalle.get('porcMarkup');

    // Deriva costoUnit (siempre neto) desde costoIngresado (lo que el usuario
    // escribe) cada vez que ese valor cambia, o cambia el impuesto de la
    // linea (la tasa usada para la conversion). A proposito NO reacciona al
    // toggle "costoIncluyeIva" de cabecera - ese caso lo maneja la suscripcion
    // global (ver ngOnInit), que va en el sentido inverso: si el usuario
    // cambia el toggle a mitad de captura, lo que se recalcula es como se
    // MUESTRA el costo ya tecleado, nunca el costo neto real ya calculado
    // (evita que cambiar el toggle por error reinterprete numeros ya buenos).
    if (costoIngresadoCtrl && impuesto1Ctrl) {
      combineLatest([
        costoIngresadoCtrl.valueChanges.pipe(startWith(costoIngresadoCtrl.value)),
        impuesto1Ctrl.valueChanges.pipe(startWith(impuesto1Ctrl.value))
      ]).subscribe(([costoIngresado, objimpuesto1]) => {
        const incluyeIva = this.formulario.get('costoIncluyeIva')?.value;
        const tasa = objimpuesto1?.porcentaje || 0;
        const neto = incluyeIva ? (costoIngresado || 0) / (1 + tasa / 100) : (costoIngresado || 0);
        costoCtrl?.setValue(neto, { emitEvent: true }); // emitEvent:true - dispara el calculo de Neto/Dcto/IVA/Total mas abajo
      });
    }

    // Triangulo Costo(con IVA) <-> Markup(%) <-> Precio Venta: los 3 estan
    // ligados por una sola formula (precioVenta = costoConIva*(1+markup/100)),
    // asi que cualquiera de los 2 primeros que cambie recalcula el tercero,
    // manteniendolos siempre consistentes entre si. Markup ya no es solo
    // informativo (antes venia fijo desde onArticuloChange) - el usuario lo
    // puede editar directamente, y editar Precio Venta a mano recalcula el
    // markup implicito (en vez de "congelar" Precio Venta como antes). Todo
    // cruce se escribe con emitEvent:false para no encadenarse en loop.

    // A) Costo o Markup cambian -> recalcular Precio Venta.
    if (costoCtrl && impuesto1Ctrl && porcMarkupCtrl && precioVentaCtrl) {
      combineLatest([
        costoCtrl.valueChanges.pipe(startWith(costoCtrl.value)),
        impuesto1Ctrl.valueChanges.pipe(startWith(impuesto1Ctrl.value)),
        porcMarkupCtrl.valueChanges.pipe(startWith(porcMarkupCtrl.value)),
      ]).subscribe(([costo, objimpuesto1, porcMarkup]) => {
        if (porcMarkup == null || porcMarkup === '') {
          return;
        }
        // El markup se aplica sobre el costo CON IVA (no el neto): es el
        // costo real que el usuario tiene disponible para vender, decision
        // explicita del negocio - validarPrecioVenta (el piso "no menor al
        // costo") sigue comparando contra el neto, eso no cambio.
        const costoConIva = (costo || 0) * (1 + ((objimpuesto1?.porcentaje || 0) / 100));
        const precioSugerido = costoConIva * (1 + (Number(porcMarkup) / 100));
        precioVentaCtrl.setValue(Math.round(precioSugerido * 100) / 100, { emitEvent: false });
        // setValue no formatea la vista (eso lo hace onBlur al escribir a
        // mano) - como esto pasa mientras el usuario sigue escribiendo el
        // costo o el markup (ese input no tiene el foco de Precio Venta), hay
        // que refrescar el texto mostrado a mano.
        if (this.mostrarPrecioVenta) {
          this.formatearPrecioVentaVisibles();
        }
      });
    }

    // B) El usuario edita Precio Venta directamente -> recalcular el Markup
    // implicito (para que quede consistente con lo que acaba de escribir, en
    // vez de mostrar un % desactualizado). Se escribe con emitEvent:false, asi
    // que no dispara de vuelta el punto A.
    precioVentaCtrl?.valueChanges.subscribe((precioVenta) => {
      const costo = costoCtrl?.value || 0;
      const objimpuesto1 = impuesto1Ctrl?.value;
      const costoConIva = (costo || 0) * (1 + ((objimpuesto1?.porcentaje || 0) / 100));
      if (costoConIva <= 0) {
        return;
      }
      const markupImplicito = ((precioVenta || 0) / costoConIva - 1) * 100;
      porcMarkupCtrl?.setValue(Math.round(markupImplicito * 100) / 100, { emitEvent: false });
      if (this.mostrarPrecioVenta) {
        this.formatearMarkupVisibles();
      }
    });

    //subcripcion para columna neto.
    if (costoCtrl && cantidadCtrl && impuesto1Ctrl && dctoCtrl) {
      combineLatest([
        costoCtrl.valueChanges.pipe(startWith(costoCtrl.value)), // Toma el valor actual (0)
        cantidadCtrl.valueChanges.pipe(startWith(cantidadCtrl.value)),
        impuesto1Ctrl.valueChanges.pipe(startWith(impuesto1Ctrl.value)),
        dctoCtrl.valueChanges.pipe(startWith(dctoCtrl.value))

      ]).subscribe(([costo, cantidad, objimpuesto1, porc_dcto]) => {
        console.log('Calculando...', { costo, cantidad }); // Ahora sí debería entrar
        console.log('Impuesto...', { objimpuesto1 }); // Ahora sí debería entrar
        const neto = (costo || 0) * (cantidad || 0);
        const tasaImpu1 = (objimpuesto1.id);
        const imp_dcto = neto * ((porc_dcto / 100));
        const valorImpu1 = ((neto - imp_dcto) || 0) * ((objimpuesto1.porcentaje / 100) || 0);
        nuevoDetalle.get('costoTotal')?.setValue(neto, { emitEvent: false });
        nuevoDetalle.get('idTasaimp1')?.setValue(tasaImpu1, { emitEvent: false });
        nuevoDetalle.get('valorImpuesto1')?.setValue(valorImpu1, { emitEvent: false });
        nuevoDetalle.get('imp_dcto')?.setValue(imp_dcto, { emitEvent: false });
        nuevoDetalle.get('importeTotal')?.setValue((neto - imp_dcto + valorImpu1), { emitEvent: false });
        // El costo cambio: re-evaluar "Precio Venta" (validarPrecioVenta compara
        // contra costoUnit) sin esto quedaria validado contra un costo viejo.
        // La sugerencia de Precio Venta a partir del Markup vive aparte (ver
        // triangulo Costo<->Markup<->Precio Venta, arriba en este metodo).
        nuevoDetalle.get('impPrecioVta')?.updateValueAndValidity({ emitEvent: false });
      });
    }
    // añadir al FormGroup general
    this.detalles.push(nuevoDetalle);
    this.dataSource.data = this.detalles.controls as FormGroup[];
  }

  /**
  * Metodo para crear los datos de la linea vacia.
  * @returns No tiene return
  */
  crearDetalleForm(data: CompraDisponible, nextLinea: number, search: ArticuloSearch): FormGroup {

    return this.fb.group({
      // Estructura de ID que ya tenías
      //llave compuesta
      idTrans: [null],
      linea: [nextLinea, Validators.required],
      idArticulo: [data.idArticulo, Validators.required],
      idCodBarra: [data.idCodBarra, Validators.required],
      refCompras: [data.nomArticulo],
      costanterior: 0,
      // costoUnit SIEMPRE es el costo NETO (sin IVA) - lo que ya usan
      // p_costos, el promedio ponderado, el markup y validarPrecioVenta. Es un
      // valor DERIVADO: se recalcula solo, a partir de "costoIngresado" (ver
      // agregarLineaVacia) - por eso ya no lleva validadores propios, esos se
      // movieron a costoIngresado, que es el campo que el usuario si edita.
      costoUnit: [0],
      // Lo que el usuario realmente escribe en la celda "Costo" - su
      // significado depende de formulario.costoIncluyeIva (el toggle de
      // cabecera "Sin IVA"/"Con IVA"): si esta en "Sin IVA" es identico a
      // costoUnit; si esta en "Con IVA" es el costo con impuesto incluido tal
      // como viene en la factura fisica, y se convierte a neto para poblar
      // costoUnit. El mensaje ya decia "debe ser mayor a 0" pero
      // Validators.min(0) permite exactamente 0 (solo bloquea negativos) -
      // bug real reportado, una compra con costo 0 se guardaba sin error.
      // validarMayorACero exige > 0 solo si la fila ya tiene articulo.
      costoIngresado: [0, [Validators.required, this.validarMayorACero]],
      // Precio de venta (opcional): 0 = "sin precio para esta linea", valido.
      // Si es > 0, no puede ser menor al costo de la misma linea (ver
      // validarPrecioVenta) - la columna solo se muestra si mostrarPrecioVenta
      // es true, pero el control existe siempre en el FormGroup.
      impPrecioVta: [0, [Validators.min(0), this.validarPrecioVenta]],
      // % de utilidad (markup) resuelto para el articulo de esta linea, solo
      // informativo (no se envia al backend) - se llena una sola vez en
      // onArticuloChange y se usa para sugerir "Precio Venta" cada vez que el
      // costo cambia (ver la suscripcion en agregarLineaVacia).
      porcMarkup: [null],
      // Misma razon que costoUnit - una cantidad de 0 unidades no es una
      // compra real, pero solo aplica una vez que la fila tiene articulo.
      cantidad: [0, [Validators.required, this.validarMayorACero]],
      // Sin Validators.required a proposito: el descuento es opcional (0 = sin
      // descuento). Antes exigia un valor y, si el usuario lo dejaba en
      // blanco, el formulario quedaba invalido sin mostrar ningun mensaje
      // (bug real reportado - "internamente genera error pero el usuario no
      // se entera"). Ahora un campo vacio simplemente se trata como 0 (ver
      // enviarFormulario, que lo normaliza antes de enviar al backend).
      porc_dcto: [0, [Validators.min(0)]],
      imp_dcto: 0,
      idLote: [0, this.validarLoteRequerido],
      // Solo indica si la celda "Lote" debe mostrar el combo (no se envia al backend, ver enviarFormulario)
      manejaLote: false,
      stock: 0,
      objimpuesto1: [data.objimpuesto1],
      impuesto1: [data.impuesto1],
      idTasaimp1: [data.tasaimpuesto1],
      valorImpuesto1: [{ value: data.valor_impu1, disabled: true }],
      impuesto2: "N",
      idTasaimp2: 0,
      valorImpuesto2: 0,
      impuesto3: "N",
      idTasaimp3: 0,
      valorImpuesto3: 0,
      costoTotal: [{ value: data.neto, disabled: true }],
      importeTotal: [{ value: data.total, disabled: true }],

      // Campo de entrada de usuario
      search: search,
      btoCrearCodBarra: true //Inicializa el boton deshabilitado
    });
  }

  agregarCodigoBarraAlArray(datos: CodigosBarra, index: number) {
    const nuevoRegistro = this.fb.group({
      idArticulo: [datos.idArticulo],
      idCodBarra: [datos.idCodBarra],
      codBarra: [datos.codBarra],
      nomBarra: [datos.nomBarra], // O los campos que necesite tu API
      fecha_registro: [new Date()],
      linea: index
    });

    this.CodigoBarra.push(nuevoRegistro);
  }

  // Método para obtener el FormArray de detalles
  get detalles(): FormArray {
    return this.formulario.get('detalles') as FormArray;
  }

  get CodigoBarra(): FormArray {
    return this.formulario.get('nuevoCodigoBarra') as FormArray;
  }

  // Método para obtener el FormArray de lotes nuevos pendientes
  get nuevosLotes(): FormArray {
    return this.formulario.get('nuevosLotes') as FormArray;
  }

  /**
   * Validador: si el articulo de la fila maneja lote, se debe haber seleccionado uno real (id > 0).
   */
  validarLoteRequerido = (control: AbstractControl): ValidationErrors | null => {
    const fila = control.parent;
    const manejaLote = fila?.get('manejaLote')?.value;
    if (!manejaLote) {
      return null;
    }
    return Number(control.value) > 0 ? null : { loteRequerido: true };
  };

  /**
   * Validador: debe haber un proveedor real seleccionado. El valor de
   * searchProveedor siempre es un objeto (nunca null), con idProveedor:0 como
   * sentinela de "todavia sin elegir" - Validators.required no serviria aca
   * porque un objeto nunca es "vacio" para Angular.
   */
  validarProveedorSeleccionado = (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    return valor && valor.idProveedor ? null : { proveedorRequerido: true };
  };

  /**
   * Validador: Costo/Cantidad deben ser > 0, pero SOLO una vez que la fila
   * tiene un articulo real seleccionado (idArticulo != 0). Sin esta condicion,
   * la fila vacia que siempre queda al final de la grilla (para seguir
   * agregando articulos, idArticulo=0) quedaria invalida para siempre y
   * bloquearia el guardado de TODA la compra, sin importar si el resto de
   * filas esta bien. Se llama con updateValueAndValidity() apenas se elige un
   * articulo (ver onArticuloChange), porque Angular no revalida un control
   * solo porque un hermano (idArticulo) cambio de valor.
   */
  validarMayorACero = (control: AbstractControl): ValidationErrors | null => {
    const fila = control.parent;
    const idArticulo = fila?.get('idArticulo')?.value;
    if (!idArticulo) {
      return null;
    }
    return Number(control.value) > 0 ? null : { mayorACero: true };
  };

  /**
   * Validador: el precio de venta es opcional (0 = sin precio para esta linea),
   * pero si se digita algo > 0 no puede quedar por debajo del costo de la misma
   * linea (costoUnit). Defensa de UX - el backend repite esta misma regla.
   */
  validarPrecioVenta = (control: AbstractControl): ValidationErrors | null => {
    const valor = Number(control.value) || 0;
    if (valor <= 0) {
      return null;
    }
    const fila = control.parent;
    const costo = Number(fila?.get('costoUnit')?.value) || 0;
    return valor < costo ? { precioMenorAlCosto: true } : null;
  };

  /**
   * Metodo que se activa cuando el combo-lote de una fila emite un lote seleccionado o creado.
   */
  onLoteChange(lote: LoteDisponible, index: number): void {
    const fila = this.detalles.at(index);
    fila.patchValue({ idLote: lote.idLote });
    fila.get('idLote')?.updateValueAndValidity();

    // Si es un lote recien reservado (aun no existe en m_lotes), lo agregamos a la
    // lista de nuevosLotes para que se cree junto con la compra al guardar.
    if (lote.esNuevo) {
      this.agregarLoteAlArray(lote, fila.get('idArticulo')?.value, index + 1);
    }
  }

  agregarLoteAlArray(lote: LoteDisponible, idArticulo: number, linea: number): void {
    const nuevoRegistro = this.fb.group({
      idArticulo: [idArticulo],
      idLote: [lote.idLote],
      codigoLote: [lote.codigoLote],
      fecVencimiento: [lote.fecVencimiento],
      linea: [linea]
    });

    this.nuevosLotes.push(nuevoRegistro);
  }

  compareImpuestos(o1: TasasCombo, o2: TasasCombo): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
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

      //Se cargar las variables de bodega y estado , para consultar por el inventario.
      const idBodega = this.formulario.value.idBodega;
      const idEstado = this.formulario.value.idEstado;
      //Con el articulo seleccionado se consulta por API , el stock.
      this.serviceIni.stkCompraDisponible(articulo.idArticulo!, articulo.idCodBarra!, idBodega!, idEstado!).subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            //El api solo debe responder con una sola linea.
            const stockData = data[0];
            console.log(stockData);

            const fila = this.detalles.at(index);
            fila.patchValue({
              idTrans: null,
              idArticulo: articulo.idArticulo,
              idCodBarra: articulo.idCodBarra,
              linea: index + 1,
              costanterior: stockData.costo,
              stock: stockData.stock,
              nombreArticulo: articulo.nomArticulo,
              codigoArticulo: articulo.codArticulo,
              idLote: 0,
              manejaLote: articulo.manejaLote || false,
              search: articulo, //articulo para bloquear la columna de search
              // % de utilidad (markup) resuelto para este articulo (jerarquia
              // subcategoria->categoria->general, ver comprasdisponiblexbodega).
              // Se fija aca, una sola vez por seleccion de articulo - null si
              // no hay nada configurado en ningun nivel (no sugiere nada).
              porcMarkup: stockData.porc_utilidad ?? null
            });
            fila.get('idLote')?.updateValueAndValidity();
            // idArticulo acaba de pasar de 0 a un valor real - costoIngresado
            // (el campo que el usuario edita, con validarMayorACero) y
            // cantidad dependen de idArticulo (un hermano), y Angular no
            // revalida un control solo porque un hermano cambio de valor. Sin
            // esto, una fila recien elegida con costo/cantidad todavia en 0
            // se seguiria viendo "valida" hasta que el usuario tocara alguno
            // de esos dos campos a mano.
            fila.get('costoIngresado')?.updateValueAndValidity();
            fila.get('cantidad')?.updateValueAndValidity();
            // El costo aun no se ha digitado en este punto (costoUnit sigue en
            // su valor por defecto) - la sugerencia de Precio Venta se aplica
            // sola cuando el usuario lo escriba (ver suscripcion en
            // agregarLineaVacia), no hace falta forzarla aca.

            // Precarga el impuesto por defecto del maestro de artículos (queda editable
            // por línea: una compra puntual puede necesitar cambiarlo).
            const impuestoArticulo = this.list_impuestos.find(t => t.id === stockData.impuesto);
            if (impuestoArticulo) {
              fila.get('objimpuesto1')?.setValue(impuestoArticulo);
            }
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

  get totalNeto(): number {
    // 1. Obtenemos el array de valores (incluyendo los campos disabled como 'neto')
    const todasLasFilas = this.detalles.getRawValue();

    // 2. Sumamos el campo 'neto' de cada objeto en el array
    return todasLasFilas.reduce((acumulado, fila) => {
      return acumulado + (Number(fila.costoTotal) || 0);
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

  get totalCantidad(): number {
    const filas = this.detalles.getRawValue();
    return filas.reduce((acc, fila) => acc + (Number(fila.cantidad) || 0), 0);
  }

  get totalDcto(): number {
    const filas = this.detalles.getRawValue();
    return filas.reduce((acc, fila) => acc + (Number(fila.imp_dcto) || 0), 0);
  }

  get totalImpuesto1(): number {
    // 1. Obtenemos el array de valores (incluyendo los campos disabled como 'neto')
    const todasLasFilas = this.detalles.getRawValue();

    // 2. Sumamos el campo 'neto' de cada objeto en el array
    return todasLasFilas.reduce((acumulado, fila) => {
      return acumulado + (Number(fila.valorImpuesto1) || 0);
    }, 0);
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

  /**
  * Metodo para eliminar referencia del proveedor
  * @returns No tiene return
  */
  //No esta en uso
  eliminarReferenciaProveedor(): void {
    let proveedor_filtro: ProveedorSearch = {
      idProveedor: 0,
      idPersona: 0,
      codTit: '',
      nombreCompleto: ''
    }
    this.formulario.get('searchProveedor')?.enable();
    this.formulario.patchValue({
      idProveedor: 0,
      searchProveedor: proveedor_filtro
    });

  }

  ValidarColumnas() {
    let columnas = this.todasLasColumnas;
    if (!this.empresaManejaLotes) {
      columnas = columnas.filter(columna => columna !== 'Lote');
    }
    if (!this.mostrarPrecioVenta) {
      columnas = columnas.filter(columna => columna !== 'precioventa' && columna !== 'markup');
    }
    this.displayedColumns = columnas;
  }

  eliminarUltimaFilaEventsave() {
    const total = this.detalles.length;
    if (total > 0) {
      this.detalles.removeAt(total - 1);
      this.dataSource.data = [...this.detalles.controls] as FormGroup[];
    }
  }

  ModalcrearCodigoBarra(index: number): void {
    // 1. Abre el diálogo, pasando el componente modal y los datos
    this.objeto_resultado = new CodigosBarra();
    //inactivar
    this.isModalClosing = false;
    //this.isPersonSelected = true;
    const dialogRef = this.dialog.open(ModalCodigobarraComponent, {
      width: '70%', // Define el ancho del modal
      data: {
        titulo: 'REGISTRO CODIGO DE BARRA',
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

        //Capturamos el evento de la linea
        const triggerActual = this.articulosComps.toArray()[index];
        if (triggerActual) {
          //Cerramos el panel del autocompletar de esa fila inmediatamente
          triggerActual.cerrarPanel();
        }
        console.log("********************")
        console.log(this.objeto_resultado)
        // 2. Cargamos los datos
        const ArticuloAutocompletar: ArticuloSearch = {
          idArticulo: this.objeto_resultado.idArticulo, // O el campo de ID correcto
          idCodBarra: this.objeto_resultado.idCodBarra,
          codArticulo: this.objeto_resultado.codBarra,
          nomArticulo: this.objeto_resultado.nomBarra
        };
        //Cargamos la linea a la tabla
        this.onArticuloChange(ArticuloAutocompletar, index);
        //agregar nuevo objecto al arreglo
        this.agregarCodigoBarraAlArray(this.objeto_resultado, index);
        //Pasamos el foco
        this.enfocarCosto(index);

        setTimeout(() => {
          this.isModalClosing = true;
        }, 500);

        // this.searchControl.setValue(personaParaAutocompletar);
        //this.onPersonaSelected({ option: { value: personaParaAutocompletar } }); // Simular la selección
      }

    });


    console.log("fin modal");
    console.log(this.objeto_resultado);
  }

  enfocarCosto(index: number): void {

    setTimeout(() => {
      const listaCostos = this.inputsCostos.toArray();
      const inputActual = listaCostos[index];

      if (inputActual) {
        inputActual.nativeElement.focus();
        // Opcional: Seleccionar el texto para que el usuario solo tenga que escribir el precio
        inputActual.nativeElement.select();
      }
    }, 150);
  }

  // Formatea un numero como "###.###.###,00" (miles con punto, decimales con
  // coma) - solo para mostrar, el FormControl siempre guarda el numero crudo.
  formatearCosto(valor: string | number | null | undefined): string {
    const numero = Number(valor) || 0;
    return numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Al enfocar "Costo" se muestra el numero crudo (sin separadores), para que
  // sea facil de editar - el formato bonito solo aplica mientras no se escribe.
  // Opera sobre "costoIngresado" (lo que el usuario ve/escribe), no sobre
  // costoUnit (el neto real, derivado - ver agregarLineaVacia).
  onFocusCosto(event: FocusEvent, row: AbstractControl): void {
    const input = event.target as HTMLInputElement;
    const valorCrudo = row.get('costoIngresado')?.value;
    input.value = valorCrudo != null ? String(valorCrudo) : '';
    // Selecciona todo el texto para que escribir reemplace el valor en vez de
    // insertarse antes/despues del "0" que ya esta ahi.
    input.select();
  }

  // Al perder el foco se formatea lo que se ve - el FormControl (costoIngresado)
  // no cambia, sigue con el numero crudo que dispara la conversion a costoUnit.
  onBlurCosto(event: FocusEvent, row: AbstractControl): void {
    const valorCrudo = row.get('costoIngresado')?.value;
    (event.target as HTMLInputElement).value = this.formatearCosto(valorCrudo);
  }

  // Aplica el formato visual a los "Costo" ya cargados (ej. al entrar en modo
  // edicion, o al cambiar el toggle "Sin IVA"/"Con IVA") - sin esto, un valor
  // que el usuario nunca toco se ve crudo hasta el primer foco/blur.
  private formatearCostosVisibles(): void {
    setTimeout(() => {
      this.inputsCostos.toArray().forEach((inputRef, index) => {
        const fila = this.detalles.at(index);
        if (fila) {
          inputRef.nativeElement.value = this.formatearCosto(fila.get('costoIngresado')?.value);
        }
      });
    }, 150);
  }

  // Mismo mecanismo que "Costo" (ver arriba), aplicado a "Precio Venta".
  onFocusPrecioVenta(event: FocusEvent, row: AbstractControl): void {
    const input = event.target as HTMLInputElement;
    const valorCrudo = row.get('impPrecioVta')?.value;
    input.value = valorCrudo != null ? String(valorCrudo) : '';
    input.select();
  }

  // Handler generico para campos numericos simples de la grilla (Cantidad,
  // (%) Dcto) que no tienen formato especial de miles/decimales - solo
  // selecciona todo el texto al enfocar, para que escribir reemplace el valor
  // en vez de insertarse antes/despues del "0" (input.select() funciona igual
  // en inputs type="number" que en los de texto plano).
  seleccionarTexto(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  // El descuento es opcional (0 = sin descuento, ver crearDetalleForm - no
  // tiene Validators.required a proposito). En vez de mostrarle un error al
  // usuario por dejarlo en blanco, se normaliza solo a 0 al perder el foco -
  // mas simple y directo que agregar mensajes de error para un campo que ni
  // siquiera es obligatorio.
  onBlurDcto(row: AbstractControl): void {
    const ctrl = row.get('porc_dcto');
    if (!ctrl) {
      return;
    }
    if (ctrl.value === null || ctrl.value === undefined || ctrl.value === '') {
      ctrl.setValue(0);
    }
  }

  onBlurPrecioVenta(event: FocusEvent, row: AbstractControl): void {
    const valorCrudo = row.get('impPrecioVta')?.value;
    (event.target as HTMLInputElement).value = this.formatearCosto(valorCrudo);
  }

  // Aplica el formato visual a "Precio Venta" - tanto a los valores ya
  // guardados (modo edicion) como a los recien sugeridos por el auto-calculo
  // de markup (ver agregarLineaVacia), que setea el FormControl pero no toca
  // el texto mostrado si el campo no tiene el foco en ese momento.
  private formatearPrecioVentaVisibles(): void {
    setTimeout(() => {
      this.inputsPrecioVenta?.toArray().forEach((inputRef, index) => {
        const fila = this.detalles.at(index);
        if (fila) {
          inputRef.nativeElement.value = this.formatearCosto(fila.get('impPrecioVta')?.value);
        }
      });
    }, 150);
  }

  // Mismo mecanismo que "Costo"/"Precio Venta", aplicado a "Markup (%)": ya no
  // es solo informativo, el usuario lo puede editar (ver el triangulo
  // Costo<->Markup<->Precio Venta en agregarLineaVacia).
  onFocusMarkup(event: FocusEvent, row: AbstractControl): void {
    const input = event.target as HTMLInputElement;
    const valorCrudo = row.get('porcMarkup')?.value;
    input.value = valorCrudo != null ? String(valorCrudo) : '';
    input.select();
  }

  onBlurMarkup(event: FocusEvent, row: AbstractControl): void {
    const valorCrudo = row.get('porcMarkup')?.value;
    (event.target as HTMLInputElement).value = this.formatearCosto(valorCrudo);
  }

  // Aplica el formato visual a "Markup (%)" cuando se recalcula desde el
  // auto-calculo (el usuario edito Precio Venta a mano) y ese input no tiene
  // el foco en ese momento - mismo criterio que formatearPrecioVentaVisibles.
  private formatearMarkupVisibles(): void {
    setTimeout(() => {
      this.inputsMarkup?.toArray().forEach((inputRef, index) => {
        const fila = this.detalles.at(index);
        if (fila && fila.get('porcMarkup')?.value != null) {
          inputRef.nativeElement.value = this.formatearCosto(fila.get('porcMarkup')?.value);
        }
      });
    }, 150);
  }

  getSearchText(index: number): string {
    console.log("getSearchText")
    const value = this.detalles.at(index).get('search')?.value;

    if (!value) return '';

    // Si es el objeto de la interfaz ArticuloSearch
    if (typeof value === 'object') {
      return value.nomArticulo || '';
    }

    // Si el usuario solo ha escrito texto (string)
    return value;
  }

  //Actualizar srtock y costo 
  actualizarStocksMasivo(): void {
    console.log("actualizarStocksMasivo");
    const idBodega = this.formulario.get('idBodega')?.value;
    const idEstado = this.formulario.get('idEstado')?.value;

    // 1. Construir la cadena: idArticulo-idCodBarra;idArticulo-idCodBarra
    const cadenaArticulos = this.detalles.controls
      .map(f => ({ idA: f.get('idArticulo')?.value, idC: f.get('idCodBarra')?.value }))
      .filter(f => f.idA && f.idC) // Solo filas con datos
      .map(f => `${f.idA}-${f.idC}`)
      .join(';');

    console.log(cadenaArticulos);

    if (!cadenaArticulos) return;

    // 2. Llamada única al API
    this.compraService.ActualizarStockCostos(cadenaArticulos, idBodega, idEstado).subscribe({
      next: (data: any[]) => {
        console.log(data);
        data.forEach(info => {
          // Buscar la fila correspondiente en el FormArray
          const fila = this.detalles.controls.find(f =>
            f.get('idArticulo')?.value === info.idarticulo &&
            f.get('idCodBarra')?.value === info.idcodbarra
          );

          //Si encuentra fila actualiza el registro
          if (fila) {
            fila.patchValue({
              stock: info.stock,
              costanterior: info.costo
            }, { emitEvent: false });
          }
        });
      }
    });

  }

  // Muestra en un dialogo el historial de auditoria del registro actual
  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - OC ${this.objeto.nroDocum}`,
        logs: this.formulario.get('logs')?.value
      }
    });

    // Material devuelve el foco al boton que abrio el dialogo al cerrarlo (accesibilidad),
    // lo que deja el icono con el resaltado de "enfocado" pegado visualmente.
    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
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

  // Salta a la primera pestaña (en orden) que tenga un campo obligatorio invalido,
  // para que el usuario no tenga que adivinar en cual quedo el error marcado en rojo.
  irAPestanaConError(): void {
    const pestanaConError = this.camposPorPestana.findIndex(campos =>
      campos.some(campo => this.formulario.get(campo)?.invalid)
    );
    if (pestanaConError !== -1) {
      this.selectedTabIndex = pestanaConError;
    }
  }

  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario")
    const fecha_envio = new Date()

    this.formulario.patchValue({
      idEmp: this.SelectSucursalControl.value?.idEmpresa,
      idSucursal: this.SelectSucursalControl.value?.id,
      idBodega: this.SelectBodegasControl.value?.id,
      impNeto: this.totalNeto,
      impTotal: this.totalFinal,
      status: this.SelecStatusControl.value === 'Borrador' ? 'B' :
        this.SelecStatusControl.value === 'Finalizado' ? 'F' :
          this.SelecStatusControl.value === 'Cancelado' ? 'C' : 'N/A',
      ingresaBodega: 'S',
      impuesto1: 'IVA',
      valorImpuesto1: this.totalImpuesto1,
      impuesto2: 'N/A',
      valorImpuesto2: 0,
      impuesto3: 'N/A',
      valorImpuesto3: 0,
      impDescuento: 0,
      documento: 'compra',
      vista: 'CompraDirecta',
      fechaMod: fecha_envio.toISOString()
    });
    console.log("Json original");
    console.log(this.formulario.getRawValue());

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      this.comboProveedor?.marcarComoIntentado(); // Su FormControl interno queda fuera del arbol anterior
      this.irAPestanaConError();
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Eliminar la ultima fila del arreglo porque esta vacia.
    //this.eliminarUltimaFilaEventsave();
    //Auditoria
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
        const { search, objimpuesto1, btoCrearCodBarra, porcMarkup, costoIngresado, ...resto } = linea;
        // porc_dcto ya no es obligatorio en el formulario (ver crearDetalleForm) -
        // si el usuario lo dejo en blanco, el control queda en null y el backend
        // rechaza el guardado completo porque su schema no acepta null. Se
        // normaliza aca, en el unico lugar donde se arma el payload real.
        resto.porc_dcto = resto.porc_dcto ?? 0;
        return resto;
      });

    // 3. Creamos el objeto final que se enviará a la API
    const jsonParaAPI = {
      ...dataCompleta,        // Copiamos todo lo del formulario (idTrans, idEmp, etc.)
      detalles: detallesLimpios, // Reemplazamos los detalles originales por los limpios
      searchProveedor: undefined // Si también quieres quitar el buscador de proveedor
    };

    // 4. Ahora sí, enviamos jsonParaAPI al servicio
    console.log('JSON Limpio:', jsonParaAPI);
    // this.miServicio.post(jsonParaAPI).subscribe(...);



    //Evento nuevo
    if (this.isEditMode) {
      console.log("Editar")
      
      this.compraService.edit(this.objeto.idTrans!, jsonParaAPI).subscribe({
        next: (compra) => {
          console.log(compra);
          this.notificacion.showSuccess('compra actualizada con éxito!');
          this.router.navigate(['/compras']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar la compra.');
        }
      });

    } else {
      console.log("Nuevo")

      this.compraService.save(jsonParaAPI).subscribe({
        next: (compra) => {
          console.log(compra);
          this.notificacion.showSuccess('compra guardada con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          // err.error?.detail: mensajes de validacion de negocio lanzados como
          // HTTPException plano (ej. falta de configuracion en Compras > Configuración,
          // ver requerir_configurado en el backend) - no llevan el envoltorio {message:...}.
          this.notificacion.showError(err.error?.message || err.error?.detail || 'No se pudo guardar la compra.');
        }
      });

    }



  }

  resetCampos() {
    //Recuperar valores que no cambian
    const idBodega = this.formulario.value.idBodega;
    const idEstado = this.formulario.value.idEstado;

    //Limpiar el formulario
    this.objeto = new Compra();
    this.formDirective.resetForm();
    //reset grilla de logs
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    //reset grilla de articulos
    const detalle = this.formulario.get('detalles') as FormArray;
    detalle.clear();
    //reset lotes nuevos pendientes
    this.nuevosLotes.clear();
    // agregas la fila inicial "limpia"
    this.agregarLineaVacia();

    //actualizo referencias
    this.formulario.get('idBodega')?.patchValue(idBodega);
    this.formulario.get('idEstado')?.patchValue(idEstado);

    // formDirective.resetForm() solo resetea el "searchProveedor" externo -
    // el FormControl interno de combo-proveedor (deshabilitado en onSelected()
    // al elegir un proveedor) es un objeto aparte, invisible para el reset del
    // formulario padre. Sin esto, tras guardar una compra el campo Proveedor
    // quedaba bloqueado para siempre (bug real reportado).
    this.comboProveedor?.resetCampo();
  }


}
