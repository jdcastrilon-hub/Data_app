import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { AjusteStockDetalle } from '../../../../core/models/Bodega/AjusteStockDetalle';
import { MatTableDataSource } from '@angular/material/table';
import { AjusteStockInfoArticulos } from '../../../../core/interfaces/Bodega/AjusteStockInfoArticulos';
import { AjusteStock } from '../../../../core/models/Bodega/AjusteStock';
import { Compra } from '../../../../core/models/Compras/Compra';
import { CompraDetalle } from '../../../../core/models/Compras/CompraDetalle';
import { StockDisponible } from '../../../../core/models/Bodega/StockDisponible';
import { ArticuloSearch } from '../../../../core/models/Bodega/ArticuloSearch';
import { ArticuloAutocompletComponent } from '../../../resources/articulo-autocomplet/articulo-autocomplet.component';
import { EmpresaServiceService } from '../../../../core/services/core/empresa-service.service';
import { Numerador } from '../../../../core/models/core/Numerador';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'form-compra-directa',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatDialogModule, ArticuloAutocompletComponent, MatDatepickerModule, MatCheckboxModule],
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
  todasLasColumnas: string[] = ['id', 'costo', 'cantidad', 'neto', 'Lote', 'ubicacion', 'stock', 'actions'];
  displayedColumns: string[] = [];

  //Informacion general de articulos
  list_info_Articulos: AjusteStockInfoArticulos[] = [];

  //Status Compra
  defaultStatus = 'Borrador'; //Valor por defecto
  list_status: String[] = ['Borrador', 'Finalizado'];
  SelecStatusControl = new FormControl<String | null>(this.defaultStatus, Validators.required);



  constructor(private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private empresaService: EmpresaServiceService,
    private route: ActivatedRoute,
    private router: Router) {
    this.objeto = new Compra();
  }


  ngOnInit() {
    console.log(this.objeto);
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      nroDocum: this.objeto.nroDocum,
      fecDoc: [new Date(), Validators.required],
      ingresaBodega: [this.objeto.ingresaBodega, Validators.required],
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
      }
    })
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

  }



  ValidarColumnas() {
    this.displayedColumns = this.todasLasColumnas;
  }
}
