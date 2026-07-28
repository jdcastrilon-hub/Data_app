import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TrasladoBodegas } from '../../../../core/models/Bodega/TrasladoBodegas';
import { BodegaService } from '../../../../core/services/Bodega/bodega.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ArticuloSearch } from '../../../../core/models/Bodega/ArticuloSearch';
import { MatTableDataSource } from '@angular/material/table';
import { StockDisponible } from '../../../../core/models/Bodega/StockDisponible';
import { ComboBodegaComponent } from 'src/app/modules/resources/combo-bodega/combo-bodega.component';
import { ComboEstadostockComponent } from 'src/app/modules/resources/combo-estadostock/combo-estadostock.component';
import { ArticuloAutocompletComponent } from 'src/app/modules/resources/articulo-autocomplet/articulo-autocomplet.component';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { TrasladoBodegaService } from 'src/app/core/services/Bodega/traslado-bodega.service';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';


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
  titulo_form!: string;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  // Objetos "puente" para que los combos (que esperan idBodega/idEstado) puedan
  // preseleccionar el valor correcto de cada lado (origen/destino) de forma independiente.
  objetoBodegaOrigen: any = {};
  objetoBodegaDestino: any = {};
  objetoEstadoOrigen: any = {};
  objetoEstadoDestino: any = {};

  //tabla de articulos
  dataSource = new MatTableDataSource<FormGroup>();
  todasLasColumnas: string[] = ['id', 'ubicacion', 'Lote', 'stock', 'cantidad'];
  displayedColumns: string[] = [];

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;


  //constructor
  constructor(
    private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private bodegaService: BodegaService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private trasladoService: TrasladoBodegaService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.objeto = new TrasladoBodegas();
  }

  //Inicializacion de la clase
  ngOnInit(): void {

    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      // No se selecciona: siempre es la empresa de la sesion actual.
      idEmpresa: [this.objeto.idEmpresa],
      idBodegaOrigen: [this.objeto.idBodegaOrigen, Validators.required],
      idBodegaDestino: [this.objeto.idBodegaDestino, Validators.required],
      manejaUbicaciones: 'N',
      // Se asigna server-side (numerador por empresa, segun la bodega origen) al guardar.
      nroDocum: [this.objeto.nroDocum],
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

    //Si viene de view , se deben inhabilitar las propiedades de los campos
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.disable(); // Esto bloquea todos los inputs, selects y checks
      this.formulario.get('detalles')?.disable();
    }

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        this.isEditMode = true;
        if (this.isReadOnly) {
          this.titulo_form = "DETALLE TRASLADO ENTRE BODEGAS"
        } else {
          this.titulo_form = "ACTUALIZACION TRASLADO ENTRE BODEGAS"
        }
        this.ModoEdicion(Number(id)); // Llama al método de carga

      } else {
        // Si no hay ID, estamos en modo Nuevo
        this.isEditMode = false;
        this.objeto = new TrasladoBodegas();
        this.titulo_form = "REGISTROS TRASLADO ENTRE BODEGAS"
        this.agregarLineaVacia();
      }
    })

  }


  recibirBodegaOrigen(bodega: any) {
    this.formulario.patchValue({
      idBodegaOrigen: bodega.id,
      manejaUbicaciones: bodega.manejaUbicaciones
    });
    this.ValidarColumnas();
  }

  recibirBodegaDestino(bodega: any) {
    this.formulario.patchValue({
      idBodegaDestino: bodega.id,
      manejaUbicaciones: bodega.manejaUbicaciones
    });
    this.ValidarColumnas();
  }

  recibirEstadoOrigen(estado: any) {
    this.formulario.patchValue({
      idEstadoOrigen: estado.id
    });
  }

  recibirEstadoDestino(estado: any) {
    this.formulario.patchValue({
      idEstadoDestino: estado.id
    });
  }

  /**
  * Metodo para cargar el traslado de acuerdo al 'id' de la transaccion
  * @returns No tiene return
  */
  ModoEdicion(id: number): void {
    //llama el API para recuperar el objecto traslado
    this.trasladoService.getTrasladoById(id).subscribe(
      (data: TrasladoBodegas) => {
        this.objeto = { ...data }; // Cargar la data del traslado en el formulario
        this.formulario.get('idEmpresa')?.patchValue(data.idEmpresa);
        this.formulario.get('idBodegaOrigen')?.patchValue(data.idBodegaOrigen);
        this.formulario.get('idBodegaDestino')?.patchValue(data.idBodegaDestino);
        this.formulario.get('nroDocum')?.patchValue(data.nroDocum);
        this.formulario.get('idCalculo')?.patchValue(data.idCalculo);
        this.formulario.get('idEstadoOrigen')?.patchValue(data.idEstadoOrigen);
        this.formulario.get('idEstadoDestino')?.patchValue(data.idEstadoDestino);
        this.formulario.get('observacion')?.patchValue(data.observacion);
        this.formulario.get('fechaMovimiento')?.patchValue(data.fechaMovimiento);
        this.formulario.get('documento')?.patchValue(data.documento);
        this.formulario.get('vista')?.patchValue(data.vista);

        // Se actualizan los "puentes" para que cada combo preseleccione su lado correcto.
        this.objetoBodegaOrigen = { idBodega: data.idBodegaOrigen };
        this.objetoBodegaDestino = { idBodega: data.idBodegaDestino };
        this.objetoEstadoOrigen = { idEstado: data.idEstadoOrigen };
        this.objetoEstadoDestino = { idEstado: data.idEstadoDestino };

        // Se carga el log acumulado en el objecto.
        const logsFormArray = new FormArray<FormGroup>([]);
        if (data.logs?.length) {
          data.logs.forEach((log: Auditoria) => {
            logsFormArray.push(this.fb.group({
              operacion: [log.operacion],
              usuario_mod: [log.usuario_mod],
              fecha_mod: [log.fecha_mod]
            }));
          });
        }
        this.formulario.setControl('logs', logsFormArray);

        const detallesArray = this.detalles;
        detallesArray.clear();
        (data.detalles || []).forEach((det: any) => {

          let stockData: StockDisponible = {
            idArticulo: det.idArticulo,
            idCodBarra: det.idCodBarra,
            stock: det.cantDisp,
            costo: 0
          };
          let articulo_filtro: ArticuloSearch = {
            idArticulo: det.idArticulo,
            idCodBarra: det.idCodBarra,
            codArticulo: det.articulo == null ? '' : det.articulo.codArticulo,
            nomArticulo: det.articulo == null ? '' : det.articulo.nomArticulo
          }

          const nextLinea = this.detalles.length + 1;

          const nuevoDetalle = this.crearDetalleForm(stockData, nextLinea, articulo_filtro);

          nuevoDetalle.patchValue({
            cantidad: det.cantidad,
          });

          // IMPORTANTE: Bloquear el buscador si ya tiene artículo
          nuevoDetalle.get('search')?.disable();

          detallesArray.push(nuevoDetalle);
        });

        this.dataSource.data = detallesArray.controls as FormGroup[];
        this.ValidarColumnas();

        if (this.isReadOnly) {
          this.formulario.disable();
          this.formulario.get('detalles')?.disable();
        }
      },
      error => {
        console.error('Error al cargar el traslado:', error);
        this.router.navigate(['/trasladobodega']);
      }
    );
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

  // Ancho de cada campo de la primera fila: se reparte el 100% entre los campos
  // visibles (el "No." solo aparece en modo edicion/vista).
  get colWidth(): number {
    return this.isEditMode ? 100 / 6 : 20;
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

    //Se cargar las variables de bodega y estado , para consultar por el inventario (siempre desde la bodega origen).
    const idBodega = this.formulario.value.idBodegaOrigen;
    const idEstado = this.formulario.value.idEstadoOrigen;

    //Con el articulo seleccionado se consulta por API , el stock.
    this.bodegaService.stockDisponible(articulo.idArticulo!, articulo.idCodBarra!, idBodega!, idEstado!).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          //El api solo debe responder con una sola linea.
          const stockData = data[0];

          //Se asignan los valores a la fila de la tabla.
          fila.patchValue({
            idTrans: null,
            idArticulo: stockData.idArticulo,
            idCodBarra: articulo.idCodBarra,
            linea: index + 1,
            idUbicacion: 0,
            idLote: 0,
            cantDisp: stockData.stock,
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
      idCodBarra: [data.idCodBarra, Validators.required],
      linea: [nextLinea, Validators.required],

      // Campos informativos (se llenan al seleccionar el artículo)
      idUbicacion: 0,
      idLote: 0,
      cantDisp: [{ value: data.stock, disabled: true }],

      // Campo de entrada de usuario: un traslado siempre resta stock de la bodega origen,
      // por lo que la cantidad nunca puede superar el stock disponible de esa fila.
      cantidad: [0, [this.validarCantidadPositiva, this.validarStockDisponible]],
      search: search
    });
  }

  /**
   * Validador: la fila vacia final (sin articulo seleccionado, a la espera de que
   * el usuario cargue uno) no se valida todavia. Una vez tiene articulo, la
   * cantidad es obligatoria y debe ser mayor a 0.
   */
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

  /**
   * Validador: la cantidad de la fila no puede superar el stock disponible (cantDisp)
   * de esa misma fila, ya que el traslado siempre resta esa cantidad de la bodega origen.
   */
  validarStockDisponible = (control: AbstractControl): ValidationErrors | null => {
    const fila = control.parent;
    const cantDisp = Number(fila?.get('cantDisp')?.value) || 0;
    const cantidad = Number(control.value) || 0;
    return cantidad > cantDisp ? { stockInsuficiente: true } : null;
  };

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

  enviarFormulario() {
    //Asignacion de campos en cabezal
    this.formulario.patchValue({
      idEmpresa: this.loginService.getIdEmpresaActual(),
      idCalculo: 1,
      documento: 'traslado',
      vista: 'Traslado',
      fechaMod: new Date().toISOString()
    });

    // La grilla siempre trae al final una fila vacia (a la espera de que el usuario
    // cargue un articulo nuevo). Esa fila NUNCA se elimina de la grilla que ve el
    // usuario: si algo falla (validacion o backend), la tabla queda intacta. Solo
    // se descarta al construir el payload que se envia (mas abajo).
    const hayArticulosCargados = this.detalles.controls.some(fila => !!fila.get('idArticulo')?.value);
    if (!hayArticulosCargados) {
      this.notificacion.showError('Debe agregar al menos un artículo antes de guardar.');
      return;
    }

    //validacion de bodegas.
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      if (this.formulario.hasError('bodegasIguales')) {
        this.notificacion.showError('La bodega origen y destino , deben ser diferentes');
      }
      return; // Detenemos la ejecución aquí
    }

    //Auditoria
    this.agregarLogAuditoria();

    const dataCompleta = this.formulario.getRawValue();
    dataCompleta.detalles = dataCompleta.detalles
      .filter((detalle: any) => !!detalle.idArticulo) // descarta la fila vacia final
      .map((detalle: any) => {
        const { search, ...resto } = detalle;
        return resto;
      });

    if (this.isEditMode) {
      //Evento Edicion
      this.trasladoService.edit(dataCompleta, this.objeto.idTrans!).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Traslado editado con éxito!');
          this.router.navigate(['/trasladobodega']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el traslado.');
        }
      });
    } else {
      //Evento nuevo
      this.trasladoService.save(dataCompleta).subscribe({
        next: (traslado) => {
          this.notificacion.showSuccess('¡Traslado guardado con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el traslado.');
        }
      });
    }
  }

  resetCampos() {
    //Limpiar el formulario
    this.objeto = new TrasladoBodegas();
    this.formDirective.resetForm();
    //reset grilla de logs
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    //reset grilla de articulos
    const detalle = this.formulario.get('detalles') as FormArray;
    detalle.clear();
    // agregas la fila inicial "limpia"
    this.agregarLineaVacia();

    this.formulario.get('fechaMovimiento')?.patchValue(new Date());
    // nroDocum ya no se maneja localmente: el backend asigna uno nuevo en el próximo guardado.
  }

  // Muestra en un dialogo el historial de auditoria del registro actual
  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - Traslado ${this.objeto.nroDocum ?? ''}`,
        logs: this.formulario.get('logs')?.value
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
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
