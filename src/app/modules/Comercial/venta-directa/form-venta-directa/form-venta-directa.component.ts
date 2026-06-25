import { Component } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
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
import { Numerador } from 'src/app/core/models/core/Numerador';
import { Ventas } from 'src/app/core/models/Ventas/Ventas';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ServiciosiniService } from 'src/app/core/services/core/serviciosini.service';
import { SucursalServiceService } from 'src/app/core/services/General/sucursal-service.service';
import { TasaImpuestoServiceService } from 'src/app/core/services/impuestos/tasa-impuesto-service.service';
import { VentaServiceService } from 'src/app/core/services/Ventas/venta-service.service';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { ArticuloAutocompletComponent } from 'src/app/modules/resources/articulo-autocomplet/articulo-autocomplet.component';
import { ComboClienteComponent } from 'src/app/modules/resources/combo-cliente/combo-cliente.component';
import { ComboEstadostockComponent } from 'src/app/modules/resources/combo-estadostock/combo-estadostock.component';
import { MedioPago } from 'src/app/core/models/Ventas/medioPago';

@Component({
  selector: 'app-form-venta-directa',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatDialogModule, ComboClienteComponent, MatDatepickerModule,
    MatCheckboxModule, ArticuloAutocompletComponent, ComboEstadostockComponent],
  templateUrl: './form-venta-directa.component.html',
  styleUrl: './form-venta-directa.component.scss'
})
export class FormVentaDirectaComponent {


  //Variables Generales
  formulario!: FormGroup;
  objeto!: Ventas;
  titulo_form: string = 'REGISTRO DE VENTA DIRECTA';
  isEditMode: boolean = false; //Se define si el modo es nuevo o edicion

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

  constructor(private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private VentasService: VentaServiceService,
    private serviceIni: ServiciosiniService,
    private sucursalService: SucursalServiceService,
    private tasaService: TasaImpuestoServiceService,
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
      idCliente: this.objeto.idCliente,
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

      codCaja: this.objeto.idTurno,
      tipoDcto: this.objeto.tipoDcto,
      porcDescuento: [{ value: this.objeto?.porcDescuento ?? 0, disabled: true }],
      fecVenc: [new Date(), Validators.required],
      vista: this.objeto.vista,
      fechaMod: this.objeto.fechaMod,

      //Medio de pago
      formaPago: this.objeto.formaPago,
      impIgreso: this.objeto.impIgreso,
      impVuelto: this.objeto.impVuelto,
      idPago: this.objeto.idPago,

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

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        console.log("Edicion")
        this.isEditMode = true;
        //this.ModoEdicion(Number(id)); // Llama al método de carga


      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        console.log("Nuevo")
        this.isEditMode = false;
        this.objeto = new Ventas();


        this.cargarSucursales();
        this.agregarLineaVacia();
        this.ValidarColumnas(this.defaultdcto);


        //Subcribir los cambios al selecionar la sucursal
        this.SelectSucursalControl.valueChanges.subscribe(objectoSucusal => {
          if (objectoSucusal) {
            //Cargamos bodega de acuerdo a la sucursal seleccionada
            this.list_bodegas = objectoSucusal.list_bodegas!;
            const unicaBodega = this.list_bodegas[0];
            if (unicaBodega) {
              this.SelectBodegasControl.setValue(unicaBodega);
              //Asignamos al path
              this.formulario.patchValue({
                idBodega: unicaBodega.id,
              });
            }


            //Cargamos documento de acuerdo a la sucursal
            this.list_documentos = objectoSucusal.documentos!;
            const primerDocum = this.list_documentos[0];
            if (primerDocum) {
              this.SelectdocumentoControl.setValue(primerDocum);

              //Asignamos al path
              this.formulario.patchValue({
                documento: primerDocum.documento,
                serie: primerDocum.serie,
                secuencia: primerDocum.secuencia
              });
              //obtener numeracion
              this.obtenerNumerador(primerDocum.secuencia);
            }

            //Cargamos medio de pago
            this.list_mediospago = objectoSucusal.mediopago!;
            const primermedio = this.list_mediospago[0];
            if (primermedio) {
              this.SelecmediosControl.setValue(primermedio);

              //Asignamos al path
              this.formulario.patchValue({
                formaPago: primermedio.tipo
              });
              //obtener numeracion
              this.obtenerNumerador(primerDocum.secuencia);
            }


          } else {
            this.list_bodegas = []; // Limpiar si no hay categoría seleccionada
            this.list_documentos = [];
            this.list_mediospago = [];
          }
        });

        //Subcribir los cambios al selecionar la sucursal
        this.SelectdocumentoControl.valueChanges.subscribe(objDocumento => {
          if (objDocumento) {
            //Asignamos al path
            this.formulario.patchValue({
              documento: objDocumento.documento,
              serie: objDocumento.serie,
              secuencia: objDocumento.secuencia
            });
            //obtener numeracion
            this.obtenerNumerador(objDocumento.secuencia);
          }
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

        //Subcribir el tipo de documento
        this.SelectdocumentoControl.valueChanges.subscribe(objDoc => {

          if (objDoc) {
            if (objDoc.documento === 'Credito') {
              this.mostrarFecVenc = true;
            } else {
              this.mostrarFecVenc = false;
            }

          }
        });


      }
    })

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
    if (tipoDcto === 'General' || tipoDcto === 'Detalle') {
      // Mostramos porc_dcto e imp_dcto (Ocultamos solo 'Lote' si aplica)
      this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'Lote');

      // Si es 'Detalle' permitimos editar, si es 'General' quedan bloqueadas
      this.columnasEditables = (tipoDcto === 'Detalle');
    } else {
      // 'No Aplica' o null: Ocultamos las columnas de descuento y Lote
      const columnasAOcultar = ['Lote', 'porc_dcto'];
      this.displayedColumns = this.todasLasColumnas.filter(columna => !columnasAOcultar.includes(columna));
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
      refCompras: [data.nomArticulo],
      costoUnit: [0, [Validators.required, Validators.min(0)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      porc_dcto: [0, [Validators.required, Validators.min(0)]],
      imp_dcto: 0,
      idLote: 0,
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

  get vuelto(): number {
    // 1. Obtenemos el valor que ingresó el cliente (por defecto 0 si está vacío)
    const ingreso = Number(this.formulario.get('impIgreso')?.value) || 0;
    const total = this.totalFinal;

    // 2. Si no ha ingresado suficiente dinero, el vuelto es 0
    if (ingreso < total) {
      return 0;
    }

    // 3. Retornamos la diferencia
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
      impDescuento: 0,
      impVuelto: this.vuelto,
      idPago :0,
      documento: 'venta',
      vista: 'VentaDirect',
      fechaMod: fecha_envio.toISOString()
    });
    console.log("Json original");
    this.agregarLogAuditoria();

    console.log(this.formulario.getRawValue());
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }
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
      searchCliente: undefined // Si también quieres quitar el buscador de proveedor
    };

    // 4. Ahora sí, enviamos jsonParaAPI al servicio
    console.log('JSON Limpio:', jsonParaAPI);
    // this.miServicio.post(jsonParaAPI).subscribe(...);

  }


}
