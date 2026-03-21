import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { TrasladoBodegas } from '../../../../core/models/Bodega/TrasladoBodegas';
import { BodegaService } from '../../../../core/services/Bodega/bodega.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Numerador } from '../../../../core/models/core/Numerador';
import { ArticuloSearch } from '../../../../core/models/Bodega/ArticuloSearch';
import { MatTableDataSource } from '@angular/material/table';
import { StockDisponible } from '../../../../core/models/Bodega/StockDisponible';
import { ServiciosiniService } from 'src/app/core/services/core/serviciosini.service';
import { ComboBodegaComponent } from 'src/app/modules/resources/combo-bodega/combo-bodega.component';
import { ComboEstadostockComponent } from 'src/app/modules/resources/combo-estadostock/combo-estadostock.component';
import { ArticuloAutocompletComponent } from 'src/app/modules/resources/articulo-autocomplet/articulo-autocomplet.component';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { TrasladoBodegaService } from 'src/app/core/services/Bodega/traslado-bodega.service';


@Component({
  selector: 'form-traslado',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule,
    MatAutocompleteModule, MatDatepickerModule, ComboBodegaComponent, ComboEstadostockComponent, ArticuloAutocompletComponent
  ],
  templateUrl: './form-traslado.component.html',
  styleUrl: './form-traslado.component.scss'
})
export class FormTrasladoComponent {

  formulario!: FormGroup;

  //parametros de entrada
  objeto!: TrasladoBodegas;
  isEditMode: boolean = false;

  //tabla de articulos
  dataSource = new MatTableDataSource<FormGroup>();
  todasLasColumnas: string[] = ['id', 'ubicacion', 'Lote', 'stock', 'cantidad', 'actions'];
  displayedColumns: string[] = [];


  //Informacion general de articulos
  //list_info_Articulos: AjusteStockInfoArticulos[] = [];

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;


  //constructor
  constructor(
    private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private bodegaService: BodegaService,
    private serviceIni: ServiciosiniService,
    private notificacion: NotificacionesService,
    private trasladoService: TrasladoBodegaService
  ) {
    this.objeto = new TrasladoBodegas();
  }

  //Inicializacion de la clase
  ngOnInit(): void {

    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      idBodegaOrigen: [this.objeto.idBodegaOrigen, Validators.required],
      idBodegaDestino: [this.objeto.idBodegaDestino, Validators.required],
      manejaUbicaciones: 'N',
      nroDocum: [{ value: this.objeto.nroDocum, disabled: true }],
      idCalculo: [this.objeto.idCalculo],
      idEstadoOrigen: [this.objeto.idEstadoOrigen, Validators.required],
      idEstadoDestino: [this.objeto.idEstadoDestino, Validators.required],
      observacion: [this.objeto.observacion, Validators.required],
      fechaMovimiento: [new Date(), Validators.required], //this.objeto.fechaMovimiento
      documento: this.objeto.documento,
      vista: this.objeto.vista,
      fechaMod: this.objeto.fechaMod,
      detalles: this.fb.array([]),
      logs: this.fb.array([]),
    }, { validators: this.validarBodegas });

    //Carga Numerador
    this.obtenerNumerador("id_nrodocum_trasladobodega");

    this.agregarLineaVacia();

  }


  recibirBodegaOrigen(bodega: any) {
    console.log('El padre recibió la bodega:', bodega);
    this.formulario.patchValue({
      idBodegaOrigen: bodega.id,
      manejaUbicaciones: bodega.manejaUbicaciones
    });
    this.ValidarColumnas();
  }

  recibirBodegaDestino(bodega: any) {
    console.log('El padre recibió la bodega:', bodega);
    this.formulario.patchValue({
      idBodegaDestino: bodega.id,
      manejaUbicaciones: bodega.manejaUbicaciones
    });
    this.ValidarColumnas();
  }

  recibirEstadoOrigen(estado: any) {
    console.log('El padre recibió el estado:', estado);
    this.formulario.patchValue({
      idEstadoOrigen: estado.id
    });
  }

  recibirEstadoDestino(estado: any) {
    console.log('El padre recibió el estado:', estado);
    this.formulario.patchValue({
      idEstadoDestino: estado.id
    });
  }

  obtenerNumerador(numerador: string): void {
    this.serviceIni.numeradorNext(numerador).subscribe({
      next: (data: Numerador) => {
        this.formulario.get('nroDocum')?.patchValue(data.next_value);
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
    const idBodega = this.formulario.value.idBodegaOrigen;
    const idEstado = this.formulario.value.idEstadoOrigen;

    //Con el articulo seleccionado se consulta por API , el stock.
    this.bodegaService.stockDisponible(articulo.idArticulo!, idBodega!, idEstado!).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          //El api solo debe responder con una sola linea.
          const stockData = data[0];
          console.log(stockData);

          //Se asignan los valores a la fila de la tabla.
          fila.patchValue({
            idTrans: null,
            idArticulo: stockData.idArticulo,
            linea: index + 1,
            idUbicacion: 0,
            idLote: 0,
            cantDisp: stockData.stock,
            // nombreArticulo: stockData.nomArticulo,
            //codigoArticulo: stockData.codArticulo,
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
      idCodBarra: 0,
      stock: 0,
      costo: 0
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
      //llave compuesta
      idTrans: [null],
      idArticulo: [data.idArticulo, Validators.required],
      linea: [nextLinea, Validators.required],

      // Campos informativos (se llenan al seleccionar el artículo)
      idUbicacion: 0,
      idLote: 0,
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
      documento: 'traslado',
      vista: 'Traslado',
      fechaMod: new Date().toISOString()
    });
    console.log(this.formulario.getRawValue());
    console.log(this.formulario.invalid);

    //validacion de bodegas.
    if (this.formulario.invalid) {
      // Si las bodegas son iguales, el formulario será inválido
      this.notificacion.showError('La bodega origen y destino , deben ser diferentes');
      return; // Detenemos la ejecución aquí
    }
    //Eliminar la ultima fila del arreglo porque esta vacia.
    this.eliminarUltimaFilaEventsave();

    //Auditoria
    this.agregarLogAuditoria();
    console.log("OBJECTO");
    console.log(this.formulario.getRawValue());
    const dataCompleta = this.formulario.getRawValue();
    dataCompleta.detalles = dataCompleta.detalles.map((detalle: any) => {
      const { search, ...resto } = detalle;
      return resto;
    });
    console.log(dataCompleta);

    //Evento nuevo
    this.trasladoService.save(this.formulario.getRawValue()).subscribe({
      next: (traslado) => {
        // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
        console.log(traslado);
        this.notificacion.showSuccess('Traslado guardado con éxito!');
        //this.resetCampos();

      },
      error: (err) => {
        console.error('Error al guardar:', err);
      }
    });
  }

  // Validacion
  validarBodegas(control: AbstractControl): ValidationErrors | null {
    const origen = control.get('idBodegaOrigen')?.value;
    const destino = control.get('idBodegaDestino')?.value;

    // Solo validamos si ambos tienen un valor seleccionado
    if (origen && destino && origen === destino) {
      return { bodegasIguales: true };
    }

    return null;
  }


}