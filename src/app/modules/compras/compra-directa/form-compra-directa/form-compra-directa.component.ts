import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { Numerador } from '../../../../core/models/core/Numerador';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ComboProveedorComponent } from '../../../resources/combo-proveedor/combo-proveedor.component';
import { ComboEstadostockComponent } from '../../../resources/combo-estadostock/combo-estadostock.component';
import { combineLatest, startWith } from 'rxjs';
import { CompraDisponible } from '../../../../core/interfaces/Compras/CompraDisponible';
import { SucursalServiceService } from '../../../../core/services/General/sucursal-service.service';
import { ProveedorSearch } from '../../../../core/interfaces/Compras/ProveedorSearch';
import { TasasCombo } from '../../../../core/interfaces/Impuestos/TasasCombo';
import { TasaImpuestoServiceService } from '../../../../core/services/impuestos/tasa-impuesto-service.service';
import { ComprasService } from '../../../../core/services/Compras/compras.service';
import { ServiciosiniService } from 'src/app/core/services/core/serviciosini.service';
import { SucursalCombo } from 'src/app/core/interfaces/Core/SucursalCombo';
import { BodegaCombo } from 'src/app/core/interfaces/Bodega/BodegaCombo';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { CodigosBarra } from 'src/app/core/models/Bodega/CodigosBarra';
import { ModalCodigobarraComponent } from '../modal-codigobarra/modal-codigobarra.component';
import { Auditoria } from 'src/app/core/models/core/Auditoria';

@Component({
  selector: 'form-compra-directa',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatDialogModule, ArticuloAutocompletComponent, MatDatepickerModule,
    MatCheckboxModule, ComboProveedorComponent, ComboEstadostockComponent],
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

  //tabla de articulos
  detalle: CompraDetalle[] = [];
  dataSource = new MatTableDataSource<FormGroup>();
  todasLasColumnas: string[] = ['position', 'id', 'Lote', 'stock', 'costoant', 'costo', 'cantidad', 'porc_dcto', 'impuesto1', 'neto', 'imp_dcto', 'imp1', 'total'];
  displayedColumns: string[] = [];

  //Informacion general de articulos
  list_info_Articulos: AjusteStockInfoArticulos[] = [];

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

  //Se refrencia el autoCompletar de articulos para cambiar de foco una vez se use.
  @ViewChildren('inputCosto') inputsCostos!: QueryList<ElementRef>;

  // Capturamos todos los triggers de la tabla
  @ViewChildren(ArticuloAutocompletComponent) articulosComps!: QueryList<ArticuloAutocompletComponent>;


  constructor(private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private compraService: ComprasService,
    private serviceIni: ServiciosiniService,
    private sucursalService: SucursalServiceService,
    private tasaService: TasaImpuestoServiceService,
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
      nroDocum: this.objeto.nroDocum,
      fecDoc: [new Date(), Validators.required],
      remito: this.objeto.remito,
      status: this.objeto.status,
      ingresaBodega: [this.objeto.ingresaBodega, Validators.required],
      idBodega: this.objeto.idBodega,
      idEstado: this.objeto.idEstado,
      impNeto: this.objeto.impNeto,
      impDescuento: this.objeto.impDescuento,
      impTotal: this.objeto.impTotal,
      observaciones: this.objeto.observaciones,
      impuesto1: this.objeto.impuesto1,
      valorImpuesto1: this.objeto.valorImpuesto1,
      impuesto2: this.objeto.impuesto2,
      valorImpuesto2: this.objeto.valorImpuesto2,
      impuesto3: this.objeto.impuesto3,
      valorImpuesto3: this.objeto.valorImpuesto3,
      documento: this.objeto.documento,
      vista: this.objeto.vista,
      fechaMod: this.objeto.fechaMod,
      detalles: this.fb.array([]),
      nuevoCodigoBarra: this.fb.array([]),
      logs: this.fb.array([]),
      searchProveedor: proveedor_filtro
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
        this.objeto = new Compra();

        //Numerador de OC
        this.obtenerNumerador("id_nrodocum_compra");
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
        this.objeto.idSucursal = data.bodega.idSucursal; // Se carga aparte porque no viene en la raiz del json

        this.titulo_form = 'ACTUALIZACION COMPRA '
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

          // 4. Seteamos los valores específicos de la edición que no son 0
          nuevoDetalle.patchValue({
            costoUnit: det.costoUnit,
            cantidad: det.cantidad,
            costoTotal: det.costoTotal,
            importeTotal: det.importeTotal,
            valorImpuesto1: det.valorImpuesto1
          });

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
            nomBarra: nuevoscodigos.nomBarra
          }

          this.agregarCodigoBarraAlArray(nuevoscodigosbarra, nuevoscodigos.linea);
        })

        //5. Actualizar infomacion de stock y costos        
        this.actualizarStocksMasivo();
        //6. agregar linea vacia y validar columnas a mostrar
        this.agregarLineaVacia();
        this.ValidarColumnas();


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
        console.error('Error al cargar la categoría:', error);
        // Opcional: Redirigir si el ID es inválido o no existe
        this.router.navigate(['/categorias']);
      }
    );
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
  * Metodo para obtener el numerador siguiente de (nroDocum)
  *
  * @param numerador Numerador de la base de datos.
  * @returns No tiene return , carga directamente en el patchValue de 'nroDocum'
  */
  obtenerNumerador(numerador: string): void {
    this.serviceIni.numeradorNext(numerador).subscribe({
      next: (data: Numerador) => {
        this.formulario.get('nroDocum')?.patchValue(data.next_value);
      },
      error: (err) => {
        console.error('Error (obtenerNumerador)', err);
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
    const cantidadCtrl = nuevoDetalle.get('cantidad');
    const impuesto1Ctrl = nuevoDetalle.get('objimpuesto1');
    const dctoCtrl = nuevoDetalle.get('porc_dcto');

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
        const valorImpu1 = ((neto-imp_dcto) || 0) * ((objimpuesto1.porcentaje / 100) || 0);
        nuevoDetalle.get('costoTotal')?.setValue(neto, { emitEvent: false });
        nuevoDetalle.get('idTasaimp1')?.setValue(tasaImpu1, { emitEvent: false });
        nuevoDetalle.get('valorImpuesto1')?.setValue(valorImpu1, { emitEvent: false });
        nuevoDetalle.get('imp_dcto')?.setValue(imp_dcto, { emitEvent: false });
        nuevoDetalle.get('importeTotal')?.setValue((neto-imp_dcto + valorImpu1), { emitEvent: false });

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
      costoUnit: [0, [Validators.required, Validators.min(0)]],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      porc_dcto: [0, [Validators.required, Validators.min(0)]],
      imp_dcto: 0,
      idLote: 0,
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
              search: articulo //articulo para bloquear la columna de search
            });
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
    //this.displayedColumns = this.todasLasColumnas;
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'Lote');
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
      vista: 'AjusteStock',
      fechaMod: fecha_envio.toISOString()
    });
    console.log("Json original");
    console.log(this.formulario.getRawValue());

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
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
        const { search, objimpuesto1, btoCrearCodBarra, ...resto } = linea;
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
          // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
          console.log(compra);
          this.notificacion.showSuccess('compra actualizada con éxito!');
          this.objeto.fechaMod = fecha_envio;
          //this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
        }
      });

    } else {
      console.log("Nuevo")

      this.compraService.save(jsonParaAPI).subscribe({
        next: (compra) => {
          // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
          console.log(compra);
          this.notificacion.showSuccess('compra guardada con éxito!');
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
    this.objeto = new Compra();
    this.formDirective.resetForm();
    //reset grilla de logs
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    //reset grilla de articulos
    const detalle = this.formulario.get('detalles') as FormArray;
    detalle.clear();
    // agregas la fila inicial "limpia"
    this.agregarLineaVacia();

    //actualizo referencias
    this.formulario.get('idBodega')?.patchValue(idBodega);
    this.formulario.get('idEstado')?.patchValue(idEstado);
    this.formulario.get('nroDocum')?.patchValue(nrodocum + 1);


  }


}
