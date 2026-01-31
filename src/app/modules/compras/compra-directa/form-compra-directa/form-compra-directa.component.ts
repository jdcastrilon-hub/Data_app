import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { MatTableDataSource } from '@angular/material/table';
import { AjusteStockInfoArticulos } from '../../../../core/interfaces/Bodega/AjusteStockInfoArticulos';
import { Compra } from '../../../../core/models/Compras/Compra';
import { CompraDetalle } from '../../../../core/models/Compras/CompraDetalle';
import { ArticuloSearch } from '../../../../core/models/Bodega/ArticuloSearch';
import { ArticuloAutocompletComponent } from '../../../resources/articulo-autocomplet/articulo-autocomplet.component';
import { EmpresaServiceService } from '../../../../core/services/core/empresa-service.service';
import { Numerador } from '../../../../core/models/core/Numerador';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ComboProveedorComponent } from '../../../resources/combo-proveedor/combo-proveedor.component';
import { ComboBodegaComponent } from '../../../resources/combo-bodega/combo-bodega.component';
import { ComboEstadostockComponent } from '../../../resources/combo-estadostock/combo-estadostock.component';
import { combineLatest, startWith } from 'rxjs';
import { CompraDisponible } from '../../../../core/interfaces/Compras/CompraDisponible';
import { Sucursal } from '../../../../core/models/General/Sucursal';
import { SucursalServiceService } from '../../../../core/services/General/sucursal-service.service';
import { Bodega } from '../../../../core/models/Bodega/Bodega';
import { ProveedorSearch } from '../../../../core/interfaces/Compras/ProveedorSearch';
import { TasasCombo } from '../../../../core/interfaces/Impuestos/TasasCombo';
import { TasaImpuestoServiceService } from '../../../../core/services/impuestos/tasa-impuesto-service.service';
import { ComprasService } from '../../../../core/services/Compras/compras.service';

@Component({
  selector: 'form-compra-directa',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatDialogModule, ArticuloAutocompletComponent, MatDatepickerModule,
    MatCheckboxModule, ComboProveedorComponent],
  templateUrl: './form-compra-directa.component.html',
  styleUrl: './form-compra-directa.component.scss'
})
export class FormCompraDirectaComponent {

  //Variables Generales
  formulario!: FormGroup;
  objeto!: Compra;
  isEditMode: boolean = false; //Se define si el modo es nuevo o edicion

  //tabla de articulos
  detalle: CompraDetalle[] = [];
  dataSource = new MatTableDataSource<FormGroup>();
  todasLasColumnas: string[] = ['id', 'costo', 'cantidad', 'neto', 'impuesto1', 'imp1', 'total', 'Lote', 'stock'];
  displayedColumns: string[] = [];

  //Informacion general de articulos
  list_info_Articulos: AjusteStockInfoArticulos[] = [];

  //Status Compra
  defaultStatus = 'Borrador'; //Valor por defecto
  list_status: String[] = ['Borrador', 'Finalizado'];
  SelecStatusControl = new FormControl<String | null>(this.defaultStatus, Validators.required);

  //Seleccion para sucursales.
  list_sucursal: Sucursal[] = [];
  SelectSucursalControl = new FormControl<Sucursal | null>(null, Validators.required);

  //Bodegas
  list_bodegas: Bodega[] = [];
  SelectBodegasControl = new FormControl<Bodega | null>(null, Validators.required);

  //Impuestos
  list_impuestos: TasasCombo[] = [];
  SelectImpuestosControl = new FormControl<TasasCombo | null>(null, Validators.required);

  constructor(private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private compraService: ComprasService,
    private empresaService: EmpresaServiceService,
    private sucursalService: SucursalServiceService,
    private tasaService: TasaImpuestoServiceService,
    private route: ActivatedRoute,
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
        //this.ModoEdicion(Number(id)); // Llama al método de carga

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        console.log("Nuevo")
        this.isEditMode = false;
        this.objeto = new Compra();
        //Numerador de OC
        this.obtenerNumerador("id_nrodocum_compra");
        this.formulario.get('ingresaBodega')?.patchValue(false);
        this.agregarLineaVacia();
        this.ValidarColumnas();
        this.cargarSucursales();
        this.cargarImpuestos();
      }
    })

    //Subcribir los cambios al selecionar la empresa
    this.SelectSucursalControl.valueChanges.subscribe(objectoSucusal => {
      if (objectoSucusal) {
        this.list_bodegas = objectoSucusal.list_bodegas!;
        const unicaBodega = this.list_bodegas[0];
        this.SelectBodegasControl.setValue(unicaBodega);
      } else {
        this.list_bodegas = []; // Limpiar si no hay categoría seleccionada
      }
    });

    //Subcribir la grilla de impuestos
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
    this.formulario.patchValue({
      idProveedor: proveedor.idProveedor,
      searchProveedor: proveedor
    });
    this.formulario.get('searchProveedor')?.disable();
    //fila.get('search')?.disable(); //Se bloque la primera columna.
  }

  cargarSucursales(): void {
    this.sucursalService.sucursalesxBodegas().subscribe({
      next: (data) => {
        this.list_sucursal = data;

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
    this.empresaService.numeradorNext(numerador).subscribe({
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
      codArticulo: '',
      nomArticulo: '',
      stock: 0,
      ubicacion: '',
      idLote: '',
      costo: 0,
      neto: 0,
      impuesto1: impuesto_base,
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
    const impuesto1Ctrl = nuevoDetalle.get('impuesto1');


    //subcripcion para columna neto.
    if (costoCtrl && cantidadCtrl && impuesto1Ctrl) {
      combineLatest([
        costoCtrl.valueChanges.pipe(startWith(costoCtrl.value)), // Toma el valor actual (0)
        cantidadCtrl.valueChanges.pipe(startWith(cantidadCtrl.value)),
        impuesto1Ctrl.valueChanges.pipe(startWith(impuesto1Ctrl.value)),
      ]).subscribe(([costo, cantidad, impuesto1]) => {
        console.log('Calculando...', { costo, cantidad }); // Ahora sí debería entrar
        console.log('Impuesto...', { impuesto1 }); // Ahora sí debería entrar
        const neto = (costo || 0) * (cantidad || 0);
        const valorImpu1 = (neto || 0) * (impuesto1.porcentaje || 0);
        nuevoDetalle.get('costoTotal')?.setValue(neto, { emitEvent: false });
        nuevoDetalle.get('valorImpuesto1')?.setValue(valorImpu1, { emitEvent: false });
        nuevoDetalle.get('importeTotal')?.setValue((neto + valorImpu1), { emitEvent: false });
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
      id: this.fb.group({
        idArticulo: [data.idArticulo, Validators.required],
        linea: [nextLinea, Validators.required],
        idTrans: [null]
      }),


      refCompras: [data.nomArticulo],
      codigoBarras: "0",
      costoUnit: [0, [Validators.required, Validators.min(0)]],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      idLote:0,
      stock: 0,
      impuesto1: [data.impuesto1],
      idTasaimp1 : 0,
      valorImpuesto1 : [{ value: data.valor_impu1, disabled: true }],
      impuesto2 : "N",
      idTasaimp2 : 0,
      valorImpuesto2 : 0,
      impuesto3 : "N",
      idTasaimp3 : 0,
      valorImpuesto3 : 0,
      costoTotal : [{ value: data.neto, disabled: true }],
      importeTotal: [{ value: data.total, disabled: true }],

      // Campo de entrada de usuario

      search: search
    });
  }

  // Método para obtener el FormArray de detalles
  get detalles(): FormArray {
    return this.formulario.get('detalles') as FormArray;
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

    const fila = this.detalles.at(index);
    fila.patchValue({
      id: {
        idArticulo: articulo.idArticulo,
        linea: index + 1,
        idTrans: null
      },
      idUbicacion: 0,
      idLote: 0,
      cantDisp: 0,
      nombreArticulo: articulo.nomArticulo,
      codigoArticulo: articulo.codArticulo,
      cantidad: 0,
      search: articulo //articulo para bloquear la columna de search
    });
    fila.get('search')?.disable(); //Se bloque la primera columna.

    this.agregarLineaVacia();

  }

  get totalNeto(): number {
    // 1. Obtenemos el array de valores (incluyendo los campos disabled como 'neto')
    const todasLasFilas = this.detalles.getRawValue();

    // 2. Sumamos el campo 'neto' de cada objeto en el array
    return todasLasFilas.reduce((acumulado, fila) => {
      return acumulado + (Number(fila.valorImpuesto1) || 0);
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
      return acumulado + (Number(fila.costoUnit) || 0);
    }, 0);
  }

  /**
  * Metodo para eliminar la ultima linea de la tabla , ya que esta vacio , se utiliza en el evento post
  * @returns No tiene return
  */
  eliminarLineaDetalles(index: number): void {
    this.detalles.removeAt(index);
    this.dataSource.data = this.detalles.controls as FormGroup[];

    if (this.detalles.length == 0) {
      this.agregarLineaVacia();
    }
  }

  ValidarColumnas() {
    this.displayedColumns = this.todasLasColumnas;
  }

  eliminarUltimaFilaEventsave() {
    const total = this.detalles.length;
    if (total > 0) {
      this.detalles.removeAt(total - 1);
      this.dataSource.data = [...this.detalles.controls] as FormGroup[];
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

  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario")
    this.formulario.patchValue({
      idEmp: this.SelectSucursalControl.value?.idEmpresa,
      idSucursal: this.SelectSucursalControl.value?.id,
      idBodega: this.SelectBodegasControl.value?.id,
      impNeto: this.totalNeto,
      impTotal: this.totalFinal,
      impuesto1: 'IVA',
      valorImpuesto1: this.totalImpuesto1,
      impuesto2: 'N/A',
      valorImpuesto2: 0,
      impuesto3: 'N/A',
      valorImpuesto3: 0,
      impDescuento: 0,
      documento: 'compra',
      vista: 'AjusteStock',
      fechaMod: new Date().toISOString()
    });
    console.log(this.formulario.getRawValue());

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Eliminar la ultima fila del arreglo porque esta vacia.
    this.eliminarUltimaFilaEventsave();
    //Auditoria
    this.agregarLogAuditoria();

    //Evento nuevo
    this.compraService.save(this.formulario.getRawValue()).subscribe({
      next: (compra) => {
        // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
        console.log(compra);
        // 4. Redirigir a la vista de lista principal.
        //this.router.navigate(['/ajustestock']);
      },
      error: (err) => {
        console.error('Error al guardar:', err);
      }
    });
  }


}
