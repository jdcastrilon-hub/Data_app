import { Component } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { TrasladoBodegas } from '../../../../core/models/Bodega/TrasladoBodegas';
import { BodegaService } from '../../../../core/services/Bodega/bodega.service';
import { EstadosService } from '../../../../core/services/Bodega/estados.service';
import { EstadoListView } from '../../../../core/interfaces/Bodega/EstadoListView';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { EmpresaServiceService } from '../../../../core/services/core/empresa-service.service';
import { Numerador } from '../../../../core/models/core/Numerador';
import { debounceTime, finalize, Observable, switchMap, tap } from 'rxjs';
import { ArticuloSearch } from '../../../../core/models/Bodega/ArticuloSearch';
import { TrasladoBodegasDetalle } from '../../../../core/models/Bodega/TrasladoBodegasDetalle';
import { MatTableDataSource } from '@angular/material/table';
import { ArticuloServiceService } from '../../../../core/services/Bodega/articulo-service.service';
import { StockDisponible } from '../../../../core/models/Bodega/StockDisponible';
import { BodegaCombo } from 'src/app/core/interfaces/Bodega/BodegaCombo';
import { EstadoCombo } from 'src/app/core/interfaces/Bodega/EstadoCombo';


@Component({
  selector: 'form-traslado',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule,
    MatAutocompleteModule, MatDatepickerModule
  ],
  templateUrl: './form-traslado.component.html',
  styleUrl: './form-traslado.component.scss'
})
export class FormTrasladoComponent {

  formulario!: FormGroup;

  //parametros de entrada
  objeto!: TrasladoBodegas;
  isEditMode: boolean = false;

  //Bodegas Origen
  list_bodegas_Origen: BodegaCombo[] = [];
  SelectBodegasOrigenControl = new FormControl<BodegaCombo | null>(null, Validators.required);

  //Bodegas Destino
  list_bodegas_Destino: BodegaCombo[] = [];
  SelectBodegasDestinoControl = new FormControl<BodegaCombo | null>(null, Validators.required);

  //Estados de Stock Origen
  list_estados_Origen: EstadoCombo[] = [];
  SelecEstadoOrigenControl = new FormControl<EstadoCombo | null>(null, Validators.required);

  //Estados de Stock Destino
  list_estados_Destino: EstadoCombo[] = [];
  SelecEstadoDestinoControl = new FormControl<EstadoCombo | null>(null, Validators.required);

  //Autocompletar para el articulo
  // 1. Control para el campo de entrada
  searchControl = new FormControl();

  // 2. Observable que contendrá los resultados del backend
  filteredArticulos!: Observable<ArticuloSearch[]>;

  //tabla de articulos
  detalle: TrasladoBodegasDetalle[] = [];
  dataSource = new MatTableDataSource<FormGroup>();
  todasLasColumnas: string[] = ['id', 'name', 'ubicacion', 'Lote', 'stock', 'cantidad', 'actions'];
  //arreglo de columnas a mostrar en el HTML
  displayedColumns: string[] = [];

  isLoading = false;

  //constructor
  constructor(
    private fb: FormBuilder,
    private bodegaService: BodegaService,
    private estadoService: EstadosService,
    private empresaService: EmpresaServiceService,
    private articuloService: ArticuloServiceService,
  ) {
    this.objeto = new TrasladoBodegas();
  }

  //Inicializacion de la clase
  ngOnInit(): void {

    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      nroDocum: [{ value: this.objeto.nroDocum, disabled: true }],
      fechaMovimiento: [new Date(), Validators.required], //this.objeto.fechaMovimiento
      detalles: this.fb.array([]),
      logs: this.fb.array([]),
    });

    //Cargar Bodegas
    this.cargarBodegas();
    //Carga Estados
    this.cargarEstados();
    //Carga Numerador
    this.obtenerNumerador("id_nrodocum_ajustestock");

    //
    this.filteredArticulos = this.searchControl.valueChanges.pipe(
      // 3. Aplica debounce: espera 400ms después de la última pulsación para iniciar la búsqueda
      debounceTime(400),
      // 4. Tap para indicar que la carga ha iniciado
      tap(() => this.isLoading = true),
      // 5. switchMap cancela la búsqueda anterior si hay una nueva (importante para evitar respuestas desordenadas)
      switchMap(value => {
        // value puede ser el texto ingresado o el objeto DTO seleccionado
        const query = typeof value === 'string' ? value : value.codigo;

        if (query && query.length > 2) {
          // Llama al servicio para buscar en el backend
          return this.articuloService.Search(query).pipe(
            // 6. Finalmente, desactiva el indicador de carga
            finalize(() => this.isLoading = false)
          );
        } else {
          this.isLoading = false;
          return new Observable<ArticuloSearch[]>(); // Retorna Observable vacío si la query es muy corta
        }
      })
    );
  }


  //Metodo para cargar lista de bodegas.
  cargarBodegas(): void {
    this.bodegaService.listSelection().subscribe({
      next: (data) => {
        this.list_bodegas_Origen = data;
        this.list_bodegas_Destino = data;

        // Condición: Si estamos en modo Nuevo (this.evento_nuevo es false)
        const unicoBodegaOrigen = this.list_bodegas_Origen[0];


        // Asigna automáticamente el único objeto de empresa al FormControl
        this.SelectBodegasOrigenControl.setValue(unicoBodegaOrigen);
        this.SelectBodegasDestinoControl.setValue(unicoBodegaOrigen);

      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  //Metodo para cargar lista de estados.
  cargarEstados(): void {
    this.estadoService.listSelection().subscribe({
      next: (data) => {
        this.list_estados_Origen = data;
        this.list_estados_Destino = data;

        // Condición: Si estamos en modo Nuevo (this.evento_nuevo es false)
        const unicoEstadoOrigen = this.list_estados_Origen[0];


        // Asigna automáticamente el único objeto de empresa al FormControl
        this.SelecEstadoOrigenControl.setValue(unicoEstadoOrigen);
        this.SelecEstadoDestinoControl.setValue(unicoEstadoOrigen);

      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  obtenerNumerador(numerador: string): void {
    this.empresaService.numeradorNext(numerador).subscribe({
      next: (data: Numerador) => {
        this.formulario.get('nroDocum')?.patchValue(data.next_value);
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  // 7. Maneja la selección del artículo
  onArticuloSelected(event: any) {
    const articuloSeleccionado: ArticuloSearch = event.option.value;

    // Lógica clave: Aquí se llama al stock disponible para decidir
    // si se auto-agrega o si se muestra el formulario de Lote/Ubicación
    // (Lógica detallada en la respuesta anterior)
    this.iniciarProcesoDeConfiguracion(articuloSeleccionado.idArticulo!);
  }

  get detalles(): FormArray {
    return this.formulario.get('detalles') as FormArray;
  }

  iniciarProcesoDeConfiguracion(id: number) {
    console.log('Artículo seleccionado. Iniciando chequeo de Lotes/Ubicaciones para ID:', id);
    // ... Aquí iría la llamada a /stock/disponible y la lógica de la decisión (Caso 1 o Caso 2)
    let idBodega: number | undefined = this.SelectBodegasOrigenControl.value?.id
    let idEstado: number | undefined = this.SelecEstadoOrigenControl.value?.id

    this.bodegaService.stockDisponible(id, idBodega!, idEstado!).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const stockData = data[0]; // Tomar el primer (y único) resultado

          const nextLinea = this.detalles.length + 1;

          const nuevoDetalle = this.crearDetalleForm(stockData, nextLinea);

          this.detalles.push(nuevoDetalle);
          this.dataSource.data = this.detalles.controls as FormGroup[];
          console.log(`Detalle para Articulo ${stockData.idArticulo} añadido en línea ${nextLinea}`);

          this.searchControl.reset();
        }

      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });

    this.ValidarColumnas();

  }

  ValidarColumnas() {

    this.displayedColumns = this.todasLasColumnas;
    /*
   const ManejaUbicacion: boolean = this.SelectBodegasOrigenControl.value?.manejaUbicaciones === 'S';

   if (ManejaUbicacion) {
     this.displayedColumns = this.todasLasColumnas;
   } else {
     //Si no maneja ubicaciones se oculta la columna
     this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'ubicacion');
   }*/
  }

  mascaraSalida(articulo: ArticuloSearch): string {
    if (articulo) {
      // Devuelve el código y el nombre para una mejor referencia visual
      return `${articulo.codArticulo} - ${articulo.nomArticulo}`;
    }
    return ''; // Devuelve cadena vacía si no hay objeto (ej: cuando el input está vacío)
  }


  crearDetalleForm(data: StockDisponible, nextLinea: number): FormGroup {
    return this.fb.group({
      // SubNivel "id" (Clave Compuesta)
      id: this.fb.group({
        // Datos del artículo (llave compuesta)
        idArticulo: [data.idArticulo, Validators.required],
        linea: [nextLinea, Validators.required],            // Valor que debes calcular (ver abajo)
        idTrans: [null]                                     // Siempre null en la creación
      }),

      idUbicacion: [{ value: data.ubicacion, disabled: true }],
      idLote: [{ value: data.lote, disabled: true }],
      cantDisp: [{ value: data.stock, disabled: true }],
      nombreArticulo: [{ value: data.nomArticulo, disabled: true }],
      codigoArticulo: [{ value: data.codArticulo, disabled: true }],
      cantidad: [0, [Validators.required, Validators.min(1)]]
    });
  }

}