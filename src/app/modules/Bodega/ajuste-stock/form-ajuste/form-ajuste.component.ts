import { Component } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AjusteStockService } from '../../../../core/services/Bodega/ajuste-stock.service';
import { AjusteStock } from '../../../../core/models/Bodega/AjusteStock';
import { BodegaService } from '../../../../core/services/Bodega/bodega.service';
import { Bodega } from '../../../../core/models/Bodega/Bodega';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, finalize, Observable, switchMap, tap } from 'rxjs';
import { ArticuloSearch } from '../../../../core/models/Bodega/ArticuloSearch';
import { ArticuloServiceService } from '../../../../core/services/Bodega/articulo-service.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Numerador } from '../../../../core/models/core/Numerador';
import { EmpresaServiceService } from '../../../../core/services/core/empresa-service.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MotivosAjuste } from '../../../../core/models/Bodega/MotivosAjuste';
import { MotivosAjusteService } from '../../../../core/services/Bodega/motivos-ajuste.service';
import { EstadoStock } from '../../../../core/models/Bodega/EstadoStock';
import { EstadosService } from '../../../../core/services/Bodega/estados.service';
import { StockDisponible } from '../../../../core/models/Bodega/StockDisponible';
import { AjusteStockDetalle } from '../../../../core/models/Bodega/AjusteStockDetalle';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { AjusteStockInfoArticulos } from '../../../../core/interfaces/Bodega/AjusteStockInfoArticulos';
import { ArticuloAutocompletComponent } from '../../../resources/articulo-autocomplet/articulo-autocomplet.component';
import { ComboBodegaComponent } from '../../../resources/combo-bodega/combo-bodega.component';
import { ComboEstadostockComponent } from '../../../resources/combo-estadostock/combo-estadostock.component';

@Component({
  selector: 'app-form-ajuste',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
     MatDatepickerModule, ArticuloAutocompletComponent,
    ComboBodegaComponent, ComboEstadostockComponent],
  templateUrl: './form-ajuste.component.html',
  styleUrl: './form-ajuste.component.scss'
})
export class FormAjusteComponent {

  //Variables Generales
  formulario!: FormGroup;
  objeto!: AjusteStock;
  isEditMode: boolean = false; //Se define si el modo es nuevo o edicion

  //Motivos de Stock
  lista_motivos: MotivosAjuste[] = [];
  SelecMotivosControl = new FormControl<MotivosAjuste | null>(null, Validators.required);

  //tabla de articulos
  detalle: AjusteStockDetalle[] = [];
  dataSource = new MatTableDataSource<FormGroup>();
  todasLasColumnas: string[] = ['id', 'ubicacion', 'Lote', 'stock', 'cantidad', 'actions'];
  displayedColumns: string[] = [];

  //Informacion general de articulos
  list_info_Articulos: AjusteStockInfoArticulos[] = [];

  //constructor
  constructor(private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private ajusteService: AjusteStockService,
    private bodegaService: BodegaService,
    private empresaService: EmpresaServiceService,
    private motivoService: MotivosAjusteService,
    private estadoService: EstadosService,
    private router: Router,
    private route: ActivatedRoute) {
    this.objeto = new AjusteStock();
  }

  ngOnInit(): void {
    console.log(this.objeto);
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      idBodega: [this.objeto.idBodega, Validators.required],
      manejaUbicaciones: 'N',
      nroDocum: [{ value: this.objeto.nroDocum, disabled: true }],
      idCalculo: [this.objeto.idCalculo],
      idEstado: [this.objeto.idEstado, Validators.required],
      motivoAjuste: [this.objeto.motivoAjuste, Validators.required],
      observacion: [this.objeto.observacion, Validators.required],
      fechaMovimiento: [new Date(), Validators.required], //this.objeto.fechaMovimiento
      documento: this.objeto.documento,
      vista: this.objeto.vista,
      fechaMod: this.objeto.fechaMod,
      detalles: this.fb.array([]),
      logs: this.fb.array([]),
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
        this.objeto = new AjusteStock();
        //Carga Motivos
        this.cargarMotivosStock();
        //Carga Numerador
        this.obtenerNumerador("id_nrodocum_ajustestock");
        //
        this.agregarLineaVacia();
        //agregar Linea vacia
        this.ValidarColumnas();
      }
    })
  }

  recibirBodega(bodega: any) {
    console.log('El padre recibió la bodega:', bodega);
    this.formulario.patchValue({
      idBodega: bodega.id,
      manejaUbicaciones: bodega.manejaUbicaciones
    });
    this.ValidarColumnas();
  }

  recibirEstado(estado: any) {
    console.log('El padre recibió la estado:', estado);
    this.formulario.patchValue({
      idEstado: estado.id
    });
  }

  /******************** Inicio Cargas Iniciales ********************/

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

  //Metodo para cargar motivos
  cargarMotivosStock(): void {
    this.motivoService.list().subscribe({
      next: (data) => {
        this.lista_motivos = data;
        console.log(data);

        //Si esta en modo edicion 
        if (this.isEditMode) {
          console.log("Modelo edicion");
          //busco ajuste por ID
          const motivoSeleccion = this.lista_motivos.find(
            obj => obj.idMotivo === this.objeto.motivoAjuste.idMotivo
          );

          if (motivoSeleccion) {
            //Se asigna Estado
            this.SelecMotivosControl.setValue(motivoSeleccion);
          }

        } else {
          const unicoregistro = this.lista_motivos[0];
          this.SelecMotivosControl.setValue(unicoregistro);
        }
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  /**
* Metodo para configurar que columnas de la tabla se pueden ver.
*
* @returns No tiene return
*/
  ValidarColumnas() {
    //Se consulta la bodega seleccionada , si maneja ubicaciones
    const ManejaUbicacion = this.formulario.value.manejaUbicaciones;
    if (ManejaUbicacion === 'S') {
      //Se cargan todas las columnas definidas
      this.displayedColumns = this.todasLasColumnas;
    } else {
      //Si no maneja ubicaciones se oculta la columna de ubicaciones
      this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'ubicacion');
    }
  }

  /******************** Fin Cargas Iniciales ********************/


  /******************** Metodos de la tabla ********************/

  // Método para obtener el FormArray de detalles
  get detalles(): FormArray {
    return this.formulario.get('detalles') as FormArray;
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

    //Se cargar las variables de bodega y estado , para consultar por el inventario.
    const idBodega = this.formulario.value.idBodega;
    const idEstado = this.formulario.value.idEstado;

    //Con el articulo seleccionado se consulta por API , el stock.
    this.bodegaService.stockDisponible(articulo.idArticulo!, idBodega!, idEstado!).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          //El api solo debe responder con una sola linea.
          const stockData = data[0];
          console.log(stockData);

          //Se asignan los valores a la fila de la tabla.
          fila.patchValue({
            id: this.fb.group({
              // Datos del artículo (llave compuesta)
              idArticulo: stockData.idArticulo,
              linea: this.detalles.length + 1,
              idTrans: null   // Siempre null en la creación , el backen los asigna
            }),

            idUbicacion: stockData.ubicacion,
            idLote: stockData.lote,
            cantDisp: stockData.stock,
            nombreArticulo: stockData.nomArticulo,
            codigoArticulo: stockData.codArticulo,
            cantidad: 0,
            search: articulo //articulo para bloquear la columna de search
          });
          fila.get('search')?.disable(); //Se bloque la primera columna.
          this.agregarLineaVacia(); //Se agrega linea vacia para que el usuario cargue mas articulos.
        }

      },
      error: (err) => {
        console.error('Error (onArticuloChange)', err);
      }
    });
  }

  /**
   * Metodo que tiene como finalidad agregar una linea vacia al final de la grilla. Se utiliza
   * cuando se carga una linea por el metodo "onArticuloChange"

   * @returns No tiene return
   */
  agregarLineaVacia(): void {

    //Se carga un metodo vacio de StockDisponible
    let stockData: StockDisponible = {
      idArticulo: 0,
      codArticulo: '',
      nomArticulo: '',
      stock: 0,
      ubicacion: '',
      lote: ''
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

    // añadir al FormGroup general
    this.detalles.push(nuevoDetalle);
    this.dataSource.data = this.detalles.controls as FormGroup[];
  }

  /**
 * Metodo para crear los datos de la linea vacia.
 * @returns No tiene return
 */
  crearDetalleForm(data: StockDisponible, nextLinea: number, search: ArticuloSearch): FormGroup {
    return this.fb.group({
      // Estructura de ID que ya tenías
      id: this.fb.group({
        idArticulo: [data.idArticulo, Validators.required],
        linea: [nextLinea, Validators.required],
        idTrans: [null]
      }),

      // Campos informativos (se llenan al seleccionar el artículo)
      idUbicacion: [{ value: data.ubicacion, disabled: true }],
      idLote: [{ value: data.lote, disabled: true }],
      cantDisp: [{ value: data.stock, disabled: true }],

      // Campo de entrada de usuario
      cantidad: [0, [Validators.required, Validators.min(0)]],
      search: search
    });
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
  /******************** FIN Metodos de la tabla ********************/

  /**
  * Metodo para cargar el ajuste de stock de acuerdo al 'id' de la transaccion
  * @returns No tiene return
  */
  ModoEdicion(id: number): void {
    console.log("ModoEdicion");
    //llama el API para recuperar el objecto categoria
    this.ajusteService.getAjusteStokById(id).subscribe(
      (data: AjusteStock) => {
        console.log("Respuesta API");
        console.log(data);
        this.objeto = data; // Cargar la data de la categoría en el formulario
        this.formulario.get('idBodega')?.patchValue(data.idBodega);
        this.formulario.get('nroDocum')?.patchValue(data.nroDocum);
        this.formulario.get('idCalculo')?.patchValue(data.idCalculo);
        this.formulario.get('idEstado')?.patchValue(data.idEstado);
        this.formulario.get('motivoAjuste')?.patchValue(data.motivoAjuste);
        this.formulario.get('observacion')?.patchValue(data.observacion);
        this.formulario.get('fechaMovimiento')?.patchValue(data.fechaMovimiento);
        this.formulario.get('documento')?.patchValue(data.documento);
        this.formulario.get('vista')?.patchValue(data.vista);
        this.formulario.get('motivoAjuste')?.patchValue(data.motivoAjuste);


        // Se carga el log acumulado en el objecto.
        const logsFormArray = new FormArray<FormGroup>([]);
        if (data.logs?.length) { // Usamos data.logs directamente
          data.logs.forEach((log: Auditoria) => {
            logsFormArray.push(this.fb.group({
              operacion: [log.operacion],
              usuario_mod: [log.usuario_mod],
              fecha_mod: [log.fecha_mod]
            }));
          });
        }
        this.formulario.setControl('logs', logsFormArray);

        //Carga Motivos
        this.cargarMotivosStock();
        //Carga Detalle de articulos parte 1.
        this.cargarInformacionArticulos(data);
        
      },
      error => {
        console.error('Error al cargar la categoría:', error);
        // Opcional: Redirigir si el ID es inválido o no existe
        this.router.navigate(['/categorias']);
      }
    );
  }

  /**
  * Metodo para cargar el detalle de la transaccion
  * @objecto : el objecto ya trae cargado los articulos , este metodo se encarga 
  * de traer la informacion del articulo (id , codigo y nombre) para mostrarlos en la pantalla
  * @returns No tiene return
  */
  cargarInformacionArticulos(objecto: AjusteStock): void {
    this.ajusteService.getArticulosById(objecto.idTrans!).subscribe({
      next: (data) => {
        console.log("Data Articulos");
        console.log(data);
        this.list_info_Articulos = data;

        const detalleArray = new FormArray<FormGroup>([]);
        objecto.detalles.forEach((detalle: AjusteStockDetalle) => {

          const infoArticulo = this.list_info_Articulos.find(
            (articulo) => articulo.id === detalle.id.idArticulo
          );

          const nombreArticulo = infoArticulo ? infoArticulo.nomArticulo : 'Artículo no encontrado';
          const codigoArticulo = infoArticulo ? infoArticulo.codArticulo : 'N/A';

          //Se carga un metodo para la creacion de ArticuloSearch
          let search: ArticuloSearch = {
            idArticulo: detalle.id.idArticulo,
            codArticulo: codigoArticulo,
            nomArticulo: nombreArticulo
          }

          detalleArray.push(this.fb.group({
            id: detalle.id,
            idUbicacion: [{ value: detalle.idUbicacion, disabled: true }],
            idLote: [{ value: detalle.idLote, disabled: true }],
            cantDisp: [{ value: detalle.cantDisp, disabled: true }],
            nombreArticulo: [{ value: nombreArticulo, disabled: true }],
            codigoArticulo: [{ value: codigoArticulo, disabled: true }],
            cantidad: [detalle.cantidad, [Validators.required, Validators.min(1)]],
            search: search
          }));
        });

        this.formulario.setControl('detalles', detalleArray);
        this.dataSource.data = this.detalles.controls as FormGroup[];
        this.ValidarColumnas();

      },
      error: (err) => {
        console.error('Error cargando bodegas', err);
      }
    });
  }

  eliminarUltimaFilaEventsave() {
    const total = this.detalles.length;
    if (total > 0) {
      this.detalles.removeAt(total - 1);
      this.dataSource.data = [...this.detalles.controls] as FormGroup[];
    }
  }


  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario")

    this.formulario.patchValue({
      idCalculo: 1,
      motivoAjuste: this.SelecMotivosControl.value,
      documento: 'ajuste',
      vista: 'AjusteStock',
      fechaMod: new Date().toISOString()
    });
    console.log(this.formulario.getRawValue());
    console.log(this.formulario.invalid);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }
    console.log("paso ")
    if (this.detalles.length <= 1) {
      console.log("Se requiere al menos 1 articulos")
      return;
    }

    //Eliminar la ultima fila del arreglo porque esta vacia.
    this.eliminarUltimaFilaEventsave();

    //Auditoria
    this.agregarLogAuditoria();
    console.log("OBJECTO");
    console.log(this.formulario.getRawValue());

    /*
        //Evento nuevo
        this.ajusteService.save(this.formulario.getRawValue()).subscribe({
          next: (ajusteSave) => {
            // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
            console.log(ajusteSave);
            // 4. Redirigir a la vista de lista principal.
            this.router.navigate(['/ajustestock']);
          },
          error: (err) => {
            console.error('Error al guardar:', err);
          }
        });
    */
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
