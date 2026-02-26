import { Component, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Articulo } from 'src/app/core/models/Bodega/Articulo';
import { Categoria } from 'src/app/core/models/Bodega/Categoria';
import { SubCategorias } from 'src/app/core/models/Bodega/SubCategorias';
import { TipoCosteo } from 'src/app/core/models/Bodega/TipoCosteo';
import { Unidad } from 'src/app/core/models/Bodega/Unidad';
import { NegocioxCategoriasDTO } from 'src/app/core/models/General/NegocioxCategoriasDTO';
import { TasaImpuesto } from 'src/app/core/models/Impuestos/TasaImpuesto';
import { ArticuloServiceService } from 'src/app/core/services/Bodega/articulo-service.service';
import { TipoCosteoServiceService } from 'src/app/core/services/Bodega/tipo-costeo-service.service';
import { UnidadServiceService } from 'src/app/core/services/Bodega/unidad-service.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { NegocioServiceService } from 'src/app/core/services/General/negocio-service.service';
import { TasaImpuestoServiceService } from 'src/app/core/services/impuestos/tasa-impuesto-service.service';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';

@Component({
  selector: 'form-bodega',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatCheckboxModule],
  templateUrl: './form-articulo.component.html',
  styleUrl: './form-articulo.component.scss'
})
export class FormArticuloComponent {
  formulario!: FormGroup;

  //parametros de entrada
  objeto!: Articulo;
  isEditMode: boolean = false;

  //Negocios
  list_negocios: NegocioxCategoriasDTO[] = [];
  SelectNegocioControl = new FormControl<NegocioxCategoriasDTO | null>(null, Validators.required);

  // Categorias
  lista_categorias: Categoria[] = [];
  lista_Subcategorias: SubCategorias[] = [];
  SelectCategoriaControl = new FormControl<Categoria | null>(null, Validators.required);
  SelectSubCategoriaControl = new FormControl<SubCategorias | null>(null, Validators.required);

  //Tipos de producto
  defaultSexo = 'Producto'; //Valor por defecto
  list_productos: String[] = ['Producto', 'Servicio'];
  SelecProductoControl = new FormControl<String | null>(this.defaultSexo, Validators.required);

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

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;

  //constructor
  constructor(
    private fb: FormBuilder,
    private articuloService: ArticuloServiceService,
    private negocioService: NegocioServiceService,
    private unidadSercice: UnidadServiceService,
    private tipoCosteoSerice: TipoCosteoServiceService,
    private tasaImpuestoService: TasaImpuestoServiceService,
    private notificacion: NotificacionesService,
    private logAuditoria: AuditoriaService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.objeto = new Articulo();
  }

  ngOnInit(): void {
    console.log("form Articulo")
    console.log(this.objeto)
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      id_articulo: [this.objeto.id_articulo],
      idsubCategoria: [this.objeto.idsubCategoria, Validators.required],
      idCategoria: [this.objeto.idCategoria, Validators.required],
      codArticulo: [this.objeto.codArticulo, Validators.required],
      nomArticulo: [this.objeto.nomArticulo, Validators.required],
      TipoProducto: [this.objeto.TipoProducto, Validators.required],
      idNegocio: [this.objeto.idNegocio, Validators.required],
      activoStock: new FormControl(false, Validators.required),
      stockMin: [this.objeto.stockMin],
      stockMax: [this.objeto.stockMax],
      activoComercial: new FormControl(false, Validators.required),
      idRef: [this.objeto.idRef, Validators.required],
      idunidad: [this.objeto.idunidad, Validators.required],
      grupoContable: [this.objeto.grupoContable],
      idCosteo: [this.objeto.idCosteo, Validators.required],
      cuentaInventario: [this.objeto.cuentaInventario],
      idImpuesto: [this.objeto.idImpuesto, Validators.required],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
    });


    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        console.log("Edicion")
        this.isEditMode = true;

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        console.log("Nuevo")
        this.isEditMode = false;
        //Carga Nefgocios
        this.cargarNegocios();
        //Carga unidades
        this.cargaUnidades();
        //carga Costeo
        this.cargatiposCosteo();
        //Carga de impuestos
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

        //Subcribir los cambios al selecionar la categoria
        this.SelectCategoriaControl.valueChanges.subscribe(categoria => {
          if (categoria) {
            this.lista_Subcategorias = categoria.subCategorias;
          } else {
            this.lista_Subcategorias = []; // Limpiar si no hay categoría seleccionada
          }
        });

        //Eventos de checbox activo Stock y Venta Comercial
        if (this.isEditMode) {
          //Edicion
          this.formulario.get('activoStock')?.setValue(this.objeto.activoStock === 'S' ? true : false);
          this.formulario.get('activoComercial')?.setValue(this.objeto.activoComercial === 'S' ? true : false);
        } else {
          //Nuevo
          this.formulario.get('activoStock')?.setValue(false);
          this.formulario.get('activoComercial')?.setValue(false);
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
    });

  }


  //Metodo para cargar lista de negocios y sus categorias.
  cargarNegocios(): void {
    this.negocioService.listNegociosxCategoria().subscribe({
      next: (data) => {
        this.list_negocios = data;

        //Evento Edicion
        if (this.isEditMode) {
          console.log("edit")
          //Evento edicion
        } else {
          const unicoregistro = this.list_negocios[0];
          this.SelectNegocioControl.setValue(unicoregistro);
        }
      },
      error: (err) => {
        console.error('Error cargando negocio', err);
      }
    });
  }

  //Metodo para cargar lista de unidades
  cargaUnidades(): void {
    this.unidadSercice.list().subscribe({
      next: (data) => {
        this.list_unidades = data;
        // Si es metodo edicion y tengo una empresa cargada.
        //La busco en la lista que me retorno el API
        if (this.isEditMode) {
          console.log("edit")
        } else {
          const unicoregistro = this.list_unidades[0];
          this.SelectUnidadControl.setValue(unicoregistro);
        }
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  //Metodo para cargar lista de costeo
  cargatiposCosteo(): void {
    this.tipoCosteoSerice.list().subscribe({
      next: (data) => {
        this.list_TipoCosteo = data;

        if (this.isEditMode) {
          console.log("edit")
        } else {
          const unicoregistro = this.list_TipoCosteo[0];
          this.SelectTipoCosteoControl.setValue(unicoregistro);
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


        if (this.isEditMode) {
          console.log("edit")
        } else {
          const unicoregistro = this.list_TasaImpuesto[0];
          this.SelectTasaImpuestoControl.setValue(unicoregistro);
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
    console.log("enviarFormulario");
    this.formulario.patchValue({
      idCategoria: this.SelectCategoriaControl.value?.id,
      idsubCategoria: this.SelectSubCategoriaControl.value?.id,
      idCosteo: this.SelectTipoCosteoControl.value?.id,
      idNegocio: this.SelectNegocioControl.value?.idNegocio,
      idunidad: this.SelectUnidadControl.value?.id,
      idImpuesto: this.SelectTasaImpuestoControl.value?.id,
      TipoProducto: this.SelecProductoControl.value === 'Producto' ? 'P' : 'S',
      //porcImp: this.SelectImpuestoControl.value,
      fechaMod: new Date().toISOString(),
      idRef: 0,
      activoStock: this.SelecProductoControl.value === 'Producto' ? 'S' : 'N',
      activoComercial: this.valorActivoComercialSN
    });
    console.log(this.formulario.getRawValue());
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }
    //Auditoria
    this.agregarLogAuditoria();
    console.log("final")
    console.log(this.formulario.getRawValue());


    if (this.isEditMode) {
      //Evento Edicion
      console.log("api ediccion");
    } else {
      //Evento nuevo
      this.articuloService.save(this.formulario.getRawValue()).subscribe({
        next: (ObjectSave) => {
          // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
          console.log(ObjectSave);
          this.notificacion.showSuccess('¡Categoría guardada con éxito!');

          // 2. Limpiar el formulario
          this.objeto = new Articulo();
          this.formDirective.resetForm();
          const logsArray = this.formulario.get('logs') as FormArray;
          logsArray.clear();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
        }
      });
    }


  }



}
