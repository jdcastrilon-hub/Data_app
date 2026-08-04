import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AjusteStockService } from '../../../../core/services/Bodega/ajuste-stock.service';
import { AjusteStock } from '../../../../core/models/Bodega/AjusteStock';
import { BodegaService } from '../../../../core/services/Bodega/bodega.service';
import { MatTableDataSource } from '@angular/material/table';
import { ArticuloSearch } from '../../../../core/models/Bodega/ArticuloSearch';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MotivosAjusteService } from '../../../../core/services/Bodega/motivos-ajuste.service'
import { StockDisponible } from '../../../../core/models/Bodega/StockDisponible';
import { AjusteStockDetalle } from '../../../../core/models/Bodega/AjusteStockDetalle';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { ArticuloAutocompletComponent } from '../../../resources/articulo-autocomplet/articulo-autocomplet.component';
import { ComboBodegaComponent } from '../../../resources/combo-bodega/combo-bodega.component';
import { ComboEstadostockComponent } from '../../../resources/combo-estadostock/combo-estadostock.component';
import { ComboLoteComponent } from 'src/app/modules/resources/combo-lote/combo-lote.component';
import { MotivosCombo } from 'src/app/core/interfaces/Bodega/MotivoCombo';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';
import { LoteDisponible } from 'src/app/core/interfaces/Bodega/LoteDisponible';

@Component({
  selector: 'form-ajustestock',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    MatDatepickerModule, ArticuloAutocompletComponent, RouterModule,
    ComboBodegaComponent, ComboEstadostockComponent, ComboLoteComponent],
  templateUrl: './form-ajuste.component.html',
  styleUrl: './form-ajuste.component.scss'
})
export class FormAjusteComponent {

  //Variables Generales
  formulario!: FormGroup;
  objeto!: AjusteStock;
  titulo_form !: string;
  isEditMode: boolean = false; //Se define si el modo es nuevo o edicion
  isReadOnly: boolean = false;

  //Motivos de Stock
  lista_motivos: MotivosCombo[] = [];
  SelecMotivosControl = new FormControl<MotivosCombo | null>(null, Validators.required);

  //tabla de articulos
  //detalle: AjusteStockDetalle[] = [];
  dataSource = new MatTableDataSource<FormGroup>();
  Columnas: string[] = ['position', 'articulo', 'ubicacion', 'Lote', 'stock', 'cantidad'];
  displayedColumns: string[] = [];

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;

  //constructor
  constructor(private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private ajusteService: AjusteStockService,
    private bodegaService: BodegaService,
    private motivoService: MotivosAjusteService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog) {
    this.objeto = new AjusteStock();
  }

  ngOnInit(): void {
    console.log(this.objeto);
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      // No se selecciona: siempre es la empresa de la sesion actual.
      idEmpresa: [this.objeto.idEmpresa],
      idBodega: [this.objeto.idBodega, Validators.required],
      manejaUbicaciones: 'N',
      // Se asigna server-side (numerador por empresa) al guardar; no se envia al crear.
      nroDocum: [this.objeto.nroDocum],
      idCalculo: [this.objeto.idCalculo],
      idEstado: [this.objeto.idEstado, Validators.required],
      idMotivo: [this.objeto.idMotivo, Validators.required],
      observacion: [this.objeto.observacion, Validators.required],
      fechaMovimiento: [new Date(), Validators.required], //this.objeto.fechaMovimiento
      documento: this.objeto.documento,
      vista: this.objeto.vista,
      fechaMod: this.objeto.fechaMod,
      detalles: this.fb.array([]),
      // Lotes pendientes (reservados, aun no existen en m_lotes) creados en esta
      // edicion via combo-lote. Se materializan solo si se guarda el ajuste.
      nuevosLotes: this.fb.array([]),
      logs: this.fb.array([]),
    });


    //Si viene de view , se deben inhabilitar las propiedades de los campos
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.disable(); // Esto bloquea todos los inputs, selects y checks
      this.SelecMotivosControl.disable();
      this.formulario.get('detalles')?.disable();
    }

    // Si el motivo elegido es de salida (signo -1), revalida todas las filas ya
    // cargadas para que se marque de inmediato cualquier cantidad que ya no alcance.
    this.SelecMotivosControl.valueChanges.subscribe(() => {
      this.detalles.controls.forEach(fila => fila.get('cantidad')?.updateValueAndValidity());
    });

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        console.log("Edicion")
        this.isEditMode = true;
        if (this.isReadOnly) {
          this.titulo_form = "DETALLE AJUSTE DE STOCK"
        } else {
          this.titulo_form = "ACTUALIZACION AJUSTE DE STOCK"
        }

        //agregar Linea vacia
        this.ValidarColumnas();
        this.ModoEdicion(Number(id)); // Llama al método de carga

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        console.log("Nuevo")
        this.isEditMode = false;
        this.objeto = new AjusteStock();
        this.titulo_form = "REGISTROS AJUSTE DE STOCK"
        //Carga Motivos
        this.cargarMotivosStock();
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
    this.recalcularStockGrilla();
  }

  recibirEstado(estado: any) {
    console.log('El padre recibió el estado:', estado);
    this.formulario.patchValue({
      idEstado: estado.id
    });
    this.recalcularStockGrilla();
  }

  /**
   * Al cambiar de bodega o de estado, el stock disponible que ya se cargó en la
   * grilla queda desactualizado (pertenece a la bodega/estado anterior). Se vuelve
   * a consultar en una sola llamada (no una por fila) para todas las filas que ya
   * tengan un artículo seleccionado, y se revalida la cantidad de cada una (por si
   * ya no alcanza contra el nuevo stock disponible).
   */
  recalcularStockGrilla(): void {
    const idBodega = this.formulario.value.idBodega;
    const idEstado = this.formulario.value.idEstado;
    if (!idBodega || !idEstado) {
      return;
    }

    const filasConArticulo = this.detalles.controls.filter(fila => !!fila.get('idArticulo')?.value);
    if (filasConArticulo.length === 0) {
      return;
    }
    const idsCodBarra = filasConArticulo.map(fila => fila.get('idCodBarra')?.value);

    this.bodegaService.stockDisponibleMasivo(idBodega, idEstado, idsCodBarra).subscribe({
      next: (data) => {
        filasConArticulo.forEach(fila => {
          const idCodBarra = fila.get('idCodBarra')?.value;
          const info = data.find(d => d.idcodbarra === idCodBarra);
          fila.patchValue({ cantDisp: info ? info.stock : 0 }, { emitEvent: false });
          fila.get('cantidad')?.updateValueAndValidity();
        });
      },
      error: (err) => {
        console.error('Error recalculando stock de la grilla', err);
      }
    });
  }

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
        this.objeto = { ...data }; // Cargar la data de la categoría en el formulario
        this.formulario.get('idEmpresa')?.patchValue(data.idEmpresa);
        this.formulario.get('idBodega')?.patchValue(data.idBodega);
        this.formulario.get('nroDocum')?.patchValue(data.nroDocum);
        this.formulario.get('idCalculo')?.patchValue(data.idCalculo);
        this.formulario.get('idEstado')?.patchValue(data.idEstado);
        this.formulario.get('idMotivo')?.patchValue(data.idMotivo);
        this.formulario.get('observacion')?.patchValue(data.observacion);
        this.formulario.get('fechaMovimiento')?.patchValue(data.fechaMovimiento);
        this.formulario.get('documento')?.patchValue(data.documento);
        this.formulario.get('vista')?.patchValue(data.vista);


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

        const detallesArray = this.detalles;
        detallesArray.clear();
        data.detalles.forEach((det: any) => {

          let stockData: StockDisponible = {
            idArticulo: det.idarticulo,
            idCodBarra: det.idCodBarra,
            stock: det.cantDisp,
            costo: 0
          };
          //Se carga un metodo vacio de ArticuloSearch
          let articulo_filtro: ArticuloSearch = {
            idArticulo: det.idarticulo,
            idCodBarra: det.idCodBarra,
            codArticulo: det.articulo == null ? '' : det.articulo.codArticulo,
            nomArticulo: det.articulo == null ? '' : det.articulo.nomArticulo
          }

          // Calcular la siguiente línea
          const nextLinea = this.detalles.length + 1;

          const nuevoDetalle = this.crearDetalleForm(stockData, nextLinea, articulo_filtro);

          // 4. Seteamos los valores específicos de la edición que no son 0
          nuevoDetalle.patchValue({
            cantidad: det.cantidad,
          });

          // IMPORTANTE: Bloquear el buscador si ya tiene artículo
          nuevoDetalle.get('search')?.disable();

          detallesArray.push(nuevoDetalle);

        });

        this.dataSource.data = detallesArray.controls as FormGroup[];

      },
      error => {
        console.error('Error al cargar el ajuste:', error);
        // Opcional: Redirigir si el ID es inválido o no existe
        this.router.navigate(['/ajustestock']);
      }
    );
  }


  /******************** Inicio Cargas Iniciales ********************/

  //Metodo para cargar motivos
  cargarMotivosStock(): void {
    this.motivoService.listSelection().subscribe({
      next: (data) => {
        this.lista_motivos = data;
        console.log(data);

        //Si esta en modo edicion 
        if (this.isEditMode) {
          console.log("Modelo edicion");
          //busco ajuste por ID
          const motivoSeleccion = this.lista_motivos.find(
            obj => obj.idMotivo === this.objeto.idMotivo
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
    // La columna "Lote" es independiente de si la bodega maneja ubicaciones: depende
    // de si el articulo de cada linea maneja lote (ver celda "Lote" en el html).
    this.displayedColumns = ManejaUbicacion === 'S'
      ? this.Columnas
      : this.Columnas.filter(columna => columna !== 'ubicacion');
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
    this.bodegaService.stockDisponible(articulo.idArticulo!, articulo.idCodBarra!, idBodega!, idEstado!).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          //El api solo debe responder con una sola linea.
          const stockData = data[0];
          console.log(stockData);

          //Se asignan los valores a la fila de la tabla.
          fila.patchValue({
            idTrans: null,
            idArticulo: articulo.idArticulo!,
            idCodBarra: articulo.idCodBarra!,
            linea: index + 1,
            idUbicacion: 0,
            idLote: 0,
            manejaLote: articulo.manejaLote || false,
            cantDisp: stockData.stock,
            cantidad: 0,
            search: articulo //articulo para bloquear la columna de search
          });
          fila.get('idLote')?.updateValueAndValidity();
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
      idCodBarra: 0,
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
      idLote: [0, this.validarLoteRequerido],
      // Solo indica si la celda "Lote" debe mostrar el combo (no se envia al backend, ver enviarFormulario)
      manejaLote: false,
      cantDisp: [{ value: data.stock, disabled: true }],

      // Campo de entrada de usuario
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
   * Metodo que se activa cuando el combo-lote de una fila emite un lote seleccionado o creado.
   */
  onLoteChange(lote: LoteDisponible, index: number): void {
    const fila = this.detalles.at(index);
    fila.patchValue({ idLote: lote.idLote });
    fila.get('idLote')?.updateValueAndValidity();

    // Si es un lote recien reservado (aun no existe en m_lotes), lo agregamos a la
    // lista de nuevosLotes para que se cree junto con el ajuste al guardar.
    if (lote.esNuevo) {
      this.agregarLoteAlArray(lote, fila.get('idArticulo')?.value, index + 1);
    }
  }

  // Método para obtener el FormArray de lotes nuevos pendientes
  get nuevosLotes(): FormArray {
    return this.formulario.get('nuevosLotes') as FormArray;
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

  /**
   * Validador: si el motivo seleccionado resta stock (signo -1), la cantidad de
   * la fila no puede superar el stock disponible (cantDisp) de esa misma fila.
   */
  validarStockDisponible = (control: AbstractControl): ValidationErrors | null => {
    const esSalida = this.SelecMotivosControl.value?.signo === -1;
    if (!esSalida) {
      return null;
    }
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
  /******************** FIN Metodos de la tabla ********************/

  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario")

    this.formulario.patchValue({
      idEmpresa: this.loginService.getIdEmpresaActual(),
      idCalculo: 1,
      idMotivo: this.SelecMotivosControl.value?.idMotivo,
      documento: 'ajuste',
      vista: 'AjusteStock',
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

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Auditoria
    this.agregarLogAuditoria();
    console.log("OBJECTO");
    console.log(this.formulario.getRawValue());
    const dataCompleta = this.formulario.getRawValue();
    dataCompleta.detalles = dataCompleta.detalles
      .filter((detalle: any) => !!detalle.idArticulo) // descarta la fila vacia final
      .map((detalle: any) => {
        const { search, ...resto } = detalle;
        return resto;
      });
    console.log(dataCompleta);


    if (this.isEditMode) {
      //Evento Edicion
      this.ajusteService.edit(dataCompleta, this.objeto.idTrans!).subscribe({
        next: (ajusteSave) => {
          this.notificacion.showSuccess('¡Ajuste editado con éxito!');
          this.router.navigate(['/ajustestock']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el ajuste.');
        }
      });
    } else {
      //Evento nuevo
      this.ajusteService.save(dataCompleta).subscribe({
        next: (ajusteSave) => {
          console.log(ajusteSave);
          this.notificacion.showSuccess('¡Ajuste guardado con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el ajuste.');
        }
      });
    }

  }

  resetCampos() {
    //Recuperar valores que no cambian
    const idBodega = this.formulario.value.idBodega;
    const idEstado = this.formulario.value.idEstado;

    //Limpiar el formulario
    this.objeto = new AjusteStock();
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
    this.formulario.get('fechaMovimiento')?.patchValue(new Date());
    // nroDocum ya no se maneja localmente: el backend asigna uno nuevo en el próximo guardado.
  }

  // Muestra en un dialogo el historial de auditoria del registro actual
  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - Ajuste ${this.objeto.nroDocum ?? ''}`,
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


}
