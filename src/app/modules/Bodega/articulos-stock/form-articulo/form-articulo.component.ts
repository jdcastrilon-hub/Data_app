import { Component, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmpresaByNegocioCategorias } from 'src/app/core/interfaces/Core/EmpresaByNegocioCategorias';
import { NegocioCombo } from 'src/app/core/interfaces/Core/NegocioCombo';
import { Articulo } from 'src/app/core/models/Bodega/Articulo';
import { Categoria } from 'src/app/core/models/Bodega/Categoria';
import { CodigosBarra } from 'src/app/core/models/Bodega/CodigosBarra';
import { SubCategorias } from 'src/app/core/models/Bodega/SubCategorias';
import { TipoServicios } from 'src/app/core/models/Bodega/TipoServicios';
import { Unidad } from 'src/app/core/models/Bodega/Unidad';
import { TasaImpuesto } from 'src/app/core/models/Impuestos/TasaImpuesto';
import { ArticuloServiceService } from 'src/app/core/services/Bodega/articulo-service.service';
import { UnidadServiceService } from 'src/app/core/services/Bodega/unidad-service.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { NegocioServiceService } from 'src/app/core/services/General/negocio-service.service';
import { TasaImpuestoServiceService } from 'src/app/core/services/impuestos/tasa-impuesto-service.service';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'form-articulo',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatCheckboxModule, MatSlideToggleModule],
  templateUrl: './form-articulo.component.html',
  styleUrl: './form-articulo.component.scss'
})
export class FormArticuloComponent {
  formulario!: FormGroup;

  //parametros de entrada
  objeto!: Articulo;
  titulo_form !: string;
  isEditMode: boolean = false;

  //Objecto de filtros
  objeto_filtro!: EmpresaByNegocioCategorias;
  
  //Negocios
  list_negocios: NegocioCombo[] = [];
  SelectNegocioControl = new FormControl<NegocioCombo | null>(null, Validators.required);

  // Categorias
  lista_categorias: Categoria[] = [];
  lista_Subcategorias: SubCategorias[] = [];
  SelectCategoriaControl = new FormControl<Categoria | null>(null, Validators.required);
  SelectSubCategoriaControl = new FormControl<SubCategorias | null>(null, Validators.required);

  //Tipos de producto
  list_productos: TipoServicios[] = [];
  SelecProductoControl = new FormControl<TipoServicios | null>(null, Validators.required);

  //Unidades
  list_unidades: Unidad[] = [];
  SelectUnidadControl = new FormControl<Unidad | null>(null, Validators.required);

  //Tipo Costeo
  list_TasaImpuesto: TasaImpuesto[] = [];
  SelectTasaImpuestoControl = new FormControl<TasaImpuesto | null>(null, Validators.required);

  //DataSource
  dataSourceCodigoBarras = new MatTableDataSource<FormGroup>();
  Columnas: string[] = ['codigo', 'nombre', 'estado', 'stock', 'actions'];

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;

  //constructor
  constructor(
    private fb: FormBuilder,
    private articuloService: ArticuloServiceService,
    private negocioService: NegocioServiceService,
    private unidadSercice: UnidadServiceService,
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
      idTipoService: [this.objeto.idTipoService, Validators.required],
      idNegocio: [this.objeto.idNegocio, Validators.required],
      activoStock: [this.objeto.activoStock, Validators.required],
      stockMin: [this.objeto.stockMin],
      stockMax: [this.objeto.stockMax],
      idRef: [this.objeto.idRef, Validators.required],
      idunidad: [this.objeto.idunidad, Validators.required],
      grupoContable: [this.objeto.grupoContable],
      cuentaInventario: [this.objeto.cuentaInventario],
      idImpuesto: [this.objeto.idImpuesto, Validators.required],
      fechaMod: [this.objeto.fechaMod],
      codigosBarra: this.fb.array([]),
      logs: this.fb.array([]),
    });


    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        console.log("Edicion")
        console.log(id)
        this.isEditMode = true;
        this.titulo_form = "ACTUALIZACION DE ARTICULO"
        this.ModoEdicion(Number(id));

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        console.log("Nuevo")
        this.isEditMode = false;
        this.titulo_form = "REGISTRO DE ARTICULOS"
        //Carga Nefgocios
        this.cargarNegocios();
        //Carga unidades
        this.cargaUnidades();
        //Carga de impuestos
        this.cargaTasaImpuesto();
        //Carga linea vacia
        this.agregarCodigoBarra();

        // Escuchar cambios en Codigo Stock
        this.formulario.get('codArticulo')?.valueChanges.subscribe(nuevoValor => {
          this.actualizarPrimeraLinea('codigo', 'codBarra', nuevoValor);
        });

        // Escuchar cambios en Nombre Articulo
        this.formulario.get('nomArticulo')?.valueChanges.subscribe(nuevoValor => {
          this.actualizarPrimeraLinea('referencia', 'nomBarra', nuevoValor);
        });

      }

      //Subcribir los cambios al selecionar la categoria
      this.SelectCategoriaControl.valueChanges.subscribe(categoria => {
        if (categoria) {
          this.lista_Subcategorias = categoria.subCategorias;
        } else {
          this.lista_Subcategorias = []; // Limpiar si no hay categoría seleccionada
        }
      });

      //Eventos de checbox activo Stock 
      if (this.isEditMode) {
        //Edicion
        this.formulario.get('activoStock')?.setValue(this.objeto.activoStock);
      } else {
        //Nuevo
        this.formulario.get('activoStock')?.setValue(true);
      }



    });

  }

  /**
   * Metodo para cargar la informacion del articulo por el (id)
   * @returns No tiene return
   */
  ModoEdicion(id: number): void {
    console.log("ModoEdicion");
    //llama el API para recuperar el objecto categoria

    this.articuloService.getArticuloById(id).subscribe(
      (data: Articulo) => {
        console.log("Respuesta API");
        console.log(data);
        this.objeto = data; // Cargar la data de la categoría en el formulario
        this.formulario.get('id_articulo')?.patchValue(data.id_articulo);
        this.formulario.get('codArticulo')?.patchValue(data.codArticulo);
        this.formulario.get('nomArticulo')?.patchValue(data.nomArticulo);
        this.formulario.get('idNegocio')?.patchValue(data.idNegocio);
        this.formulario.get('idCategoria')?.patchValue(data.idCategoria);
        this.formulario.get('idsubCategoria')?.patchValue(data.idsubCategoria);
        this.formulario.get('idunidad')?.patchValue(data.idunidad);
        this.formulario.get('idTipoService')?.patchValue(data.idTipoService);
        this.formulario.get('idImpuesto')?.patchValue(data.idImpuesto);
        this.formulario.get('activoStock')?.patchValue(data.activoStock);
        this.formulario.get('grupoContable')?.patchValue(data.grupoContable);
        this.formulario.get('cuentaInventario')?.patchValue(data.cuentaInventario);

        //Cargas
        this.cargarNegocios();
        this.cargaUnidades();
        this.cargaTasaImpuesto();

        //Carga de codigos de barra
        console.log("codigos de barra")
        //arreglo temporal para cargar los codigos de barra
        const idsTemporales: string[] = [];
        data.codigosBarra.forEach((det: any) => {
          console.log(det)
          let codigobarra: CodigosBarra = {
            idCodBarra: det.idcodbarra,
            idArticulo: det.idArticulo,
            codBarra: det.codBarra,
            nomBarra: det.nomBarra,
            estado: true,
            stock: 0,
            movimientos: 0,
            registro_nuevo: false //ya esta cargado en la base de datos
          }
          if (det.id) {
            //Añadir id al arreglo
            idsTemporales.push(det.id.toString());
          }
          this.agregarCodigoBarra(codigobarra);
        })

        //Validamos si el arreglo esta vacio , de ser asi agregamos una linea vacia , si esta lleno consultamos el stock de los codigos de barra
        if (this.getCodigosBarra.length === 0) {
          console.log("El arreglo está vacío");
          this.agregarCodigoBarra();
        } else {
          const cadenaFinal = idsTemporales.join('-');
          this.actualizarStocksMasivo(this.objeto.id_articulo!, cadenaFinal);
        }

      },
      error => {
        console.error('Error al cargar la categoría:', error);
        // Opcional: Redirigir si el ID es inválido o no existe
        this.router.navigate(['/categorias']);
      }
    );

  }

  private actualizarPrimeraLinea(campo: string, columna: string, valor: any) {
    const primeraLinea = this.getCodigosBarra.at(0);
    if (primeraLinea) {
      // emitEvent: false evita que se disparen otros eventos innecesarios
      primeraLinea.get(columna)?.setValue(valor, { emitEvent: false });
    }
  }

  //Actualizar srtock y costo 
  actualizarStocksMasivo(id_articulo: number, cadena: string): void {
    console.log("actualizarStocksMasivo");

    this.articuloService.ActualizarStock(id_articulo, cadena).subscribe({
      next: (data: any[]) => {
        console.log(data);
        data.forEach(info => {
          // Buscar la fila correspondiente en el FormArray
          const fila = this.getCodigosBarra.controls.find(f =>
            f.get('idCodBarra')?.value === info.idcodbarra
          );

          //Si encuentra fila actualiza el registro
          if (fila) {
            console.log("encontro fila")
            fila.patchValue({
              stock: info.stock,
              movimientos: info.movimientos
            }, { emitEvent: false });
          }
        });
      }
    });

  }

  //Metodo para cargar lista de negocios y sus categorias.
  cargarNegocios(): void {
    this.negocioService.listNegociosxCategoria().subscribe({
      next: (data) => {
        this.objeto_filtro = data
        this.list_negocios = this.objeto_filtro.listnegocio!;
        this.lista_categorias = this.objeto_filtro.listCategorias!;
        this.list_productos = this.objeto_filtro.tipoproductos!;
        console.log(data)

        //Evento Edicion
        if (this.isEditMode) {
          console.log("edit cargarNegocios")

          const objnegocio = this.list_negocios.find(
            neg => neg.idNegocio === this.objeto?.idNegocio
          );
          if (objnegocio) {
            this.SelectNegocioControl.setValue(objnegocio);
          }

          const categoriaEncontrada = this.lista_categorias.find(
            cat => cat.id === this.objeto?.idCategoria
          );
          if (categoriaEncontrada) {
            this.SelectCategoriaControl.setValue(categoriaEncontrada);
            //Buscar SubCategoria.
            const subcategoriaEncontrada = categoriaEncontrada.subCategorias!.find(
              sub => sub.id === this.objeto?.idsubCategoria
            );

            if (subcategoriaEncontrada) {
              this.SelectSubCategoriaControl.setValue(subcategoriaEncontrada)
            }
          }

          //Carga tipo producto.
          const objtipo = this.list_productos!.find(
            tipo => tipo.id === this.objeto?.idTipoService
          );

          if (objtipo) {
            this.SelecProductoControl.setValue(objtipo)
          }

        } else {
          const unicoregistro = this.list_negocios[0];
          this.SelectNegocioControl.setValue(unicoregistro);

          const primeroproducto = this.list_productos[0];
          this.SelecProductoControl.setValue(primeroproducto);
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
          const unidad = this.list_unidades.find(
            uni => uni.id === this.objeto?.idunidad
          );
          if (unidad) {
            this.SelectUnidadControl.setValue(unidad);
          }
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

  cargaTasaImpuesto(): void {
    this.tasaImpuestoService.list().subscribe({
      next: (data) => {
        this.list_TasaImpuesto = data;

        if (this.isEditMode) {
          console.log("edit")
          const impuesto = this.list_TasaImpuesto.find(
            imp => imp.id === this.objeto?.idImpuesto
          );
          if (impuesto) {
            this.SelectTasaImpuestoControl.setValue(impuesto);
          }
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

  get getCodigosBarra(): FormArray {
    return this.formulario.get('codigosBarra') as FormArray;
  }

  //agregar lista de codigos de barra
  agregarCodigoBarra(data?: Partial<CodigosBarra>) {
    console.log("agregarCodigoBarra");
    console.log(data)
    const subCat = this.fb.group({
      idCodBarra: [data?.idCodBarra || null],
      idArticulo: [data?.idArticulo || null],
      //codEmp: [data?.codEmp || ''],
      codBarra: [data?.codBarra || '', Validators.required],
      nomBarra: [data?.nomBarra || '', Validators.required],
      estado: [data?.estado ?? true, Validators.required],
      stock: [data?.stock || 0, Validators.required],
      movimientos: [data?.movimientos || 0, Validators.required],
      registro_nuevo: [data?.registro_nuevo ?? true, Validators.required],
    });
    this.getCodigosBarra.push(subCat);
    this.dataSourceCodigoBarras.data = this.getCodigosBarra.controls as FormGroup[];
  }

  //eliminar codigo de barra
  eliminarCodigoBarra(index: number): void {
    //Capturamos el objecto de la fila
    const fila = this.getCodigosBarra.at(index) as FormGroup;

    // 2. Extraemos el objeto movimientos
    const objecto = fila.get('movimientos')?.value;

    //Si el codigo de barra a tenido algun movimiento de stock no se puede eliminar.
    if (objecto > 0) {
      this.notificacion.showError('No se puede eliminar el codigo de barra porque tiene movimintos en el stock');
      return;
    }

    this.getCodigosBarra.removeAt(index);
    this.dataSourceCodigoBarras.data = this.getCodigosBarra.controls as FormGroup[];

    if (this.getCodigosBarra.length == 0) {
      this.agregarCodigoBarra();
      this.formulario.get('activoStock')?.setValue(true);
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
    console.log("enviarFormulario");
    this.formulario.patchValue({
      idCategoria: this.SelectCategoriaControl.value?.id,
      idsubCategoria: this.SelectSubCategoriaControl.value?.id,
      idNegocio: this.SelectNegocioControl.value?.idNegocio,
      idunidad: this.SelectUnidadControl.value?.id,
      idImpuesto: this.SelectTasaImpuestoControl.value?.id,
      idTipoService: this.SelecProductoControl.value?.id,
      fechaMod: new Date().toISOString(),
      idRef: 0
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

      this.articuloService.update(this.formulario.getRawValue()).subscribe({
        next: (ObjectSave) => {
          console.log(ObjectSave);
          this.notificacion.showSuccess('¡Articulo actualizado con éxito!');
        },
        error: (err) => { }
      });

    } else {
      //Evento nuevo
      this.articuloService.save(this.formulario.getRawValue()).subscribe({
        next: (ObjectSave) => {
          console.log(ObjectSave);
          this.notificacion.showSuccess('¡Articulo guardado con éxito!');
          //Limpiar el formulario
          this.resetCampos();
        },
        error: (err) => { }
      });
    }
  }

  resetCampos() {
    this.objeto = new Articulo();
    this.formDirective.resetForm();
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    this.formulario.get('activoStock')?.setValue(true);

  }

}
