import { Component, EventEmitter, Input, Output } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { Articulo } from '../../../../core/models/Bodega/Articulo';
import { ArticuloPayload } from '../../../../core/models/Bodega/ArticuloPayload';
import { MatTableDataSource } from '@angular/material/table';
import { CategoriaService } from '../../../../core/services/Bodega/categoria-service.service';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { Empresas } from '../../../../core/models/core/Empresas';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EmpresaServiceService } from '../../../../core/services/core/empresa-service.service';
import { Categoria } from '../../../../core/models/Bodega/Categoria';
import { SubCategorias } from '../../../../core/models/Bodega/SubCategorias';
import { ArticuloDTO } from '../../../../core/models/Bodega/ArticuloDTO';
import { ArticuloServiceService } from '../../../../core/services/Bodega/articulo-service.service';
import { Negocio } from '../../../../core/models/General/Negocio';
import { NegocioServiceService } from '../../../../core/services/General/negocio-service.service';
import { NegocioxCategoriasDTO } from '../../../../core/models/General/NegocioxCategoriasDTO';
import { UnidadServiceService } from '../../../../core/services/Bodega/unidad-service.service';
import { Unidad } from '../../../../core/models/Bodega/Unidad';
import { TipoCosteoServiceService } from '../../../../core/services/Bodega/tipo-costeo-service.service';
import { TipoCosteo } from '../../../../core/models/Bodega/tipoCosteo';
import { TasaImpuesto } from '../../../../core/models/Impuestos/TasaImpuesto';
import { TasaImpuestoServiceService } from '../../../../core/services/impuestos/tasa-impuesto-service.service';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';

@Component({
  selector: 'form-articulo',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, MatCheckboxModule],
  templateUrl: './form-articulo.component.html',
  styleUrl: './form-articulo.component.scss'
})
export class FormArticuloComponent {

  formulario!: FormGroup;

  //parametros de entrada
  @Input() objeto!: Articulo;
  @Input() numero_venta!: number;
  @Input() evento_nuevo!: boolean;
  @Input() operacion!: string;

  //Parametros de salida
  @Output() EventoArticuloEventEmiter: EventEmitter<ArticuloPayload> = new EventEmitter();

  //Parametros del formulario
  selectedValue!: string;
  dataSource = new MatTableDataSource<FormGroup>();

  //Negocios
  list_negocios: NegocioxCategoriasDTO[] = [];
  SelectNegocioControl = new FormControl<NegocioxCategoriasDTO | null>(null, Validators.required);

  // Categorias
  lista_categorias: Categoria[] = [];
  lista_Subcategorias: SubCategorias[] = [];
  SelectCategoriaControl = new FormControl<Categoria | null>(null, Validators.required);
  SelectSubCategoriaControl = new FormControl<SubCategorias | null>(null, Validators.required);

  //Unidades
  list_unidades: Unidad[] = [];
  SelectUnidadControl = new FormControl<Unidad | null>(null, Validators.required);

  //Tipo Costeo
  list_TipoCosteo: TipoCosteo[] = [];
  SelectTipoCosteoControl = new FormControl<TipoCosteo | null>(null, Validators.required);

  //Tipo Costeo
  list_TasaImpuesto: TasaImpuesto[] = [];
  SelectTasaImpuestoControl = new FormControl<TasaImpuesto | null>(null, Validators.required);

  //Eventos de checkBox
  valorActivoStockSN: string = 'N';
  valorActivoComercialSN: string = 'N';

  //Objecto DTO para edicion del articulo
  objecto_articuloDTO!: ArticuloDTO;
  categoriaSeleccionadaId: number | undefined;

  //constructor
  constructor(private fb: FormBuilder,
    private articuloService: ArticuloServiceService,
    private negocioService: NegocioServiceService,
    private unidadSercice: UnidadServiceService,
    private tipoCosteoSerice: TipoCosteoServiceService,
    private tasaImpuestoService: TasaImpuestoServiceService,
    private logAuditoria: AuditoriaService) { }

  ngOnInit(): void {
    console.log(this.objeto);
    console.log(this.evento_nuevo);

    // Se carga el log acumulado en el objecto.
    const logsFormArray = new FormArray<FormGroup>([]);
    if (this.objeto.logs?.length) {
      this.objeto.logs.forEach((log: Auditoria) => {
        logsFormArray.push(this.fb.group({
          operacion: [log.operacion],
          usuario_mod: [log.usuario_mod],
          fecha_mod: [log.fecha_mod]
        }));
      });
    }

    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      id_articulo: [this.objeto.id_articulo],
      idsubCategoria: [this.objeto.idsubCategoria, Validators.required],
      idCategoria: [this.objeto.idCategoria, Validators.required],
      codArticulo: [{ value: this.objeto.codArticulo, disabled: this.evento_nuevo }, Validators.required],
      nomArticulo: [this.objeto.nomArticulo, Validators.required],
      idNegocio: [this.objeto.idNegocio, Validators.required],
      activoStock: new FormControl(false, Validators.required),
      stockMin: [this.objeto.stockMin, Validators.required],
      stockMax: [this.objeto.stockMax, Validators.required],
      activoComercial: new FormControl(false, Validators.required),
      idRef: [this.objeto.idRef, Validators.required],
      idunidad: [this.objeto.idunidad, Validators.required],
      grupoContable: [this.objeto.grupoContable, Validators.required],
      idCosteo: [this.objeto.idCosteo, Validators.required],
      cuentaInventario: [this.objeto.cuentaInventario, Validators.required],
      idImpuesto: [this.objeto.idImpuesto, Validators.required],
      fechaMod: [this.objeto.fechaMod],
      logs: logsFormArray,

    });

    //Carga de Negocios
    this.cargarNegocios();
    //Carga de Unidades
    this.cargaUnidades();
    //Carga Tipos de Costeo
    this.cargatiposCosteo();
    //Carga de Tasas de impuesto.
    this.cargaTasaImpuesto();

    //Eventos
    //Subcribir los cambios al selecionar el negocio
    this.SelectNegocioControl.valueChanges.subscribe(categorias => {
      if (categorias) {
        this.lista_categorias = categorias.listCategorias!;
      } else {
        this.lista_categorias = []; // Limpiar si no hay categoría seleccionada
      }
    });

    // Suscribirse a los cambios en el primer mat-select
    //Cuando seleccionan una categoria , se le asigna al arreglo lista_Subcategorias , el listado del objecto
    //de subCategorias que trae el objecto categoria
    this.SelectCategoriaControl.valueChanges.subscribe(categoria => {
      if (categoria) {
        this.lista_Subcategorias = categoria.subCategorias;
      } else {
        this.lista_Subcategorias = []; // Limpiar si no hay categoría seleccionada
      }
    });

    //Eventos de checbox activo Stock y Venta Comercial
    if (!this.evento_nuevo) {
      this.formulario.get('activoStock')?.setValue(false);
      this.formulario.get('activoComercial')?.setValue(false);
    } else {
      this.formulario.get('activoStock')?.setValue(this.objeto.activoStock === 'S' ? true : false);
       this.formulario.get('activoComercial')?.setValue(this.objeto.activoComercial === 'S' ? true : false);
    }


    // Suscribirse a los cambios del checkbox para actualizar 'valorActivoStockSN'
    this.formulario.get('activoStock')?.valueChanges.subscribe(isChecked => {
      // Si el checkbox está marcado (true), asigna 'S', de lo contrario, 'N'
      this.valorActivoStockSN = isChecked ? 'S' : 'N';
    });

    this.formulario.get('activoComercial')?.valueChanges.subscribe(isChecked => {
      // Si el checkbox está marcado (true), asigna 'S', de lo contrario, 'N'
      this.valorActivoComercialSN = isChecked ? 'S' : 'N';
    });

  }

  //Metodo para cargar lista de empresa.
  cargarNegocios(): void {
    this.negocioService.listNegociosxCategoria().subscribe({
      next: (data) => {
        this.list_negocios = data;

        //Evento nuevo
        if (!this.evento_nuevo && this.list_negocios.length === 1) {
          // Condición: Si estamos en modo Nuevo (this.evento_nuevo es false)
          // Y la lista de empresas tiene exactamente 1 elemento.
          const unicoNegocio = this.list_negocios[0];

          // Asigna automáticamente el único objeto de empresa al FormControl
          this.SelectNegocioControl.setValue(unicoNegocio);

          //deshabilita el control
          this.SelectNegocioControl.disable();

          //Evento edicion
        } else if (this.evento_nuevo && this.objeto.idNegocio) {

          //busco negocio por ID
          const negocioSeleccionado = this.list_negocios.find(
            obj => obj.idNegocio === this.objeto.idNegocio
          );

          if (negocioSeleccionado) {
            //Asigno negocio encontrado
            this.SelectNegocioControl.setValue(negocioSeleccionado);
            if (this.list_negocios.length === 1) {
              this.SelectNegocioControl.disable();
            }

            //Carga Categorias
            //Busco el id de la categoria en la lista del negocio
            const categoriaSelecionada = negocioSeleccionado.listCategorias!.find(
              obj => obj.id === this.objeto.idCategoria
            );
            if (categoriaSelecionada) {
              //Se asigna Categoria
              this.SelectCategoriaControl.setValue(categoriaSelecionada);

              //Busco SubCategoria por Id 
              const subcategoriaSelecionada = categoriaSelecionada.subCategorias!.find(
                obj => obj.id === this.objeto.idsubCategoria
              );
              if (subcategoriaSelecionada) {
                //Asigno SubCategoria
                this.SelectSubCategoriaControl.setValue(subcategoriaSelecionada);
              }
            }
          }

        }
      },
      error: (err) => {
        console.error('Error cargando negocio', err);
      }
    });
  }

  cargaUnidades(): void {
    this.unidadSercice.list().subscribe({
      next: (data) => {
        this.list_unidades = data;
        // Si es metodo edicion y tengo una empresa cargada.
        //La busco en la lista que me retorno el API
        if (this.evento_nuevo && this.objeto.idunidad) {
          //busco la empresa por ID
          const unidadSeleccionada = this.list_unidades.find(
            obj => obj.id === this.objeto.idunidad
          );

          if (unidadSeleccionada) {
            // [CLAVE]: Asigna el OBJETO completo al FormControl
            this.SelectUnidadControl.setValue(unidadSeleccionada);
          }
          // Opcional: Si quieres que el usuario NO pueda cambiarla, deshabilita el control
          if (this.list_unidades.length === 1) {
            this.SelectUnidadControl.disable();
          }
        }
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  cargatiposCosteo(): void {
    this.tipoCosteoSerice.list().subscribe({
      next: (data) => {
        this.list_TipoCosteo = data;

        // Si es metodo edicion y tengo una empresa cargada.
        //La busco en la lista que me retorno el API
        if (this.evento_nuevo && this.objeto.idCosteo) {
          //busco la empresa por ID
          const costeoSeleccionado = this.list_TipoCosteo.find(
            obj => obj.id === this.objeto.idCosteo
          );

          if (costeoSeleccionado) {
            //Asigna el OBJETO completo al FormControl
            this.SelectTipoCosteoControl.setValue(costeoSeleccionado);
          }
          //deshabilita el control , si la cantidad es solo una unidad.
          if (this.list_TipoCosteo.length === 1) {
            this.SelectTipoCosteoControl.disable();
          }
        }
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  cargaTasaImpuesto(): void {
    this.tasaImpuestoService.list().subscribe({
      next: (data) => {
        this.list_TasaImpuesto = data;


        // Si es metodo edicion y tengo una empresa cargada.
        //La busco en la lista que me retorno el API
        if (this.evento_nuevo && this.objeto.idImpuesto) {
          //busco la Tasa por ID
          const TasaSeleccionada = this.list_TasaImpuesto.find(
            obj => obj.id === this.objeto.idImpuesto
          );

          if (TasaSeleccionada) {
            // [CLAVE]: Asigna el OBJETO completo al FormControl
            this.SelectTasaImpuestoControl.setValue(TasaSeleccionada);
          }
          // Opcional: Si quieres que el usuario NO pueda cambiarla, deshabilita el control
          if (this.list_TasaImpuesto.length === 1) {
            this.SelectTasaImpuestoControl.disable();
          }
        }

      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  // Método para agregar el log al FormArray
  agregarLogAuditoria() {
    // 1. Obtienes el objeto de log ya completo y formateado del servicio
    const logData = this.logAuditoria.generarLog(!this.evento_nuevo ? 'Nuevo' : 'Edicion');

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
    console.log("enviarFormulario");
    //Asignacion de campos en cabezal
    this.formulario.patchValue({
      idCategoria: this.SelectCategoriaControl.value?.id,
      idsubCategoria: this.SelectSubCategoriaControl.value?.id,
      idCosteo: this.SelectTipoCosteoControl.value?.id,
      idNegocio: this.SelectNegocioControl.value?.idNegocio,
      idunidad: this.SelectUnidadControl.value?.id,
      idImpuesto: this.SelectTasaImpuestoControl.value?.id,
      //porcImp: this.SelectImpuestoControl.value,
      fechaMod: new Date().toISOString(),
      idRef: 0,
      activoStock: this.valorActivoStockSN,
      activoComercial: this.valorActivoComercialSN
    });
    console.log(this.formulario.value);
    console.log('¿Formulario válido?', this.formulario.valid);
    console.log('Errores:', this.formulario.errors);
    console.log('Estado completo:', this.formulario);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Auditoria
    this.agregarLogAuditoria();
    console.log(this.formulario.value);


    this.EventoArticuloEventEmiter.emit({
      articulo: this.formulario.value,
      numeroVenta: this.numero_venta
    });

  }




}
