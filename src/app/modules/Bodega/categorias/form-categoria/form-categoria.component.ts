import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { Categoria } from '../../../../core/models/Bodega/Categoria';
import { MatTableDataSource } from '@angular/material/table';
import { EmpresaServiceService } from '../../../../core/services/core/empresa-service.service';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { Empresas } from '../../../../core/models/core/Empresas';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { SubCategorias } from '../../../../core/models/Bodega/SubCategorias';
import { CategoriaService } from '../../../../core/services/Bodega/categoria-service.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';

@Component({
  selector: 'form-categoria',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule],
  templateUrl: './form-categoria.component.html',
  styleUrl: './form-categoria.component.scss'
})
export class FormCategoriaComponent {
  formulario!: FormGroup;

  //parametros de entrada
  objeto!: Categoria;
  isEditMode: boolean = false;


  //Parametros del formulario
  selectedValue!: string;
  dataSource = new MatTableDataSource<FormGroup>();

  // Capturamos la referencia del formulario del HTML
  @ViewChild('formDirective') formDirective!: NgForm;

  //constructor
  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaServiceService,
    private logAuditoria: AuditoriaService,
    private categoriaService: CategoriaService,
    private router: Router,
    private route: ActivatedRoute,
    private notificacion: NotificacionesService
  ) {
    this.objeto = new Categoria();
  }

  //Empresas
  list_empresas: Empresas[] = [];
  SelectEmpresaControl = new FormControl<Empresas | null>(null, Validators.required);


  ngOnInit(): void {

    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      codCategoria: [this.objeto.codCategoria, Validators.required],
      nomCategoria: [this.objeto.nomCategoria, Validators.required],
      idEmpresa: [this.objeto.idEmpresa, Validators.required],
      estado: [this.objeto.estado],
      fechaMod: [this.objeto.fechaMod],
      subCategorias: this.fb.array([]),
      logs: this.fb.array([]),
      id: [this.objeto.id]
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
        this.objeto = new Categoria();
        // Si es nuevo, agrega una fila vacía
        this.agregarSubCategoria();
        //Carga empresas
        this.cargarEmpresas();
      }
    });

  }

  //Metodo para cargar la categoria , que viene para edicion
  ModoEdicion(id: number): void {
    //llama el API para recuperar el objecto categoria
    this.categoriaService.getCategoriaById(id).subscribe(
      (data: Categoria) => {
        console.log(data);
        this.objeto = data; // Cargar la data de la categoría en el formulario
        this.formulario.get('codCategoria')?.patchValue(data.codCategoria);
        this.formulario.get('nomCategoria')?.patchValue(data.nomCategoria);
        this.formulario.get('idEmpresa')?.patchValue(data.idEmpresa);
        this.formulario.get('estado')?.patchValue(data.estado);
        this.formulario.get('id')?.patchValue(data.id);

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

        //Cargo Empresa
        console.log("empresa");
        console.log(this.objeto)
        this.cargarEmpresas();

        //Cargo SubCategorias de la categoria
        this.objeto.subCategorias.forEach((sub) => this.agregarSubCategoria(sub));
      },
      error => {
        console.error('Error al cargar la categoría:', error);
        // Opcional: Redirigir si el ID es inválido o no existe
        this.router.navigate(['/categorias']);
      }
    );
  }


  //agregar lista de subCategorias
  agregarSubCategoria(data?: Partial<SubCategorias>) {
    const subCat = this.fb.group({
      id: [data?.id || null],
      //codEmp: [data?.codEmp || ''],
      codSubCategoria: [data?.codSubCategoria || '', Validators.required],
      nomSubCategoria: [data?.nomSubCategoria || '', Validators.required]
    });
    this.subCategorias.push(subCat);
    this.dataSource.data = this.subCategorias.controls as FormGroup[];
  }

  //eliminar subCategoria
  eliminarSubCategoria(index: number): void {
    this.subCategorias.removeAt(index);
    this.dataSource.data = this.subCategorias.controls as FormGroup[]; // ⚠️ Actualiza la tabla
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

  get subCategorias(): FormArray {
    return this.formulario.get('subCategorias') as FormArray;
  }

  //Metodo para cargar lista de empresa.
  cargarEmpresas(): void {
    this.empresaService.list().subscribe({
      next: (data) => {
        this.list_empresas = data;

        // Si es metodo edicion y tengo una empresa cargada.
        //La busco en la lista que me retorno el API
        if (this.isEditMode && this.objeto.idEmpresa) {
          //busco la empresa por ID
          const empresaSeleccionada = this.list_empresas.find(
            emp => emp.id_emp === this.objeto.idEmpresa
          );

          if (empresaSeleccionada) {
            // [CLAVE]: Asigna el OBJETO completo al FormControl
            this.SelectEmpresaControl.setValue(empresaSeleccionada);
          }
          // Opcional: Si quieres que el usuario NO pueda cambiarla, deshabilita el control
          if (this.list_empresas.length === 1) {
            this.SelectEmpresaControl.disable();
          }
        } else if (!this.isEditMode && this.list_empresas.length === 1) {
          // Condición: Si estamos en modo Nuevo (this.isEditMode es false)
          // Y la lista de empresas tiene exactamente 1 elemento.

          const unicaEmpresa = this.list_empresas[0];

          // Asigna automáticamente el único objeto de empresa al FormControl
          this.SelectEmpresaControl.setValue(unicaEmpresa);

          // Opcional: Si quieres que el usuario NO pueda cambiarla, deshabilita el control
          this.SelectEmpresaControl.disable();
        }
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }


  //Enviar Datos al formulario prinicipal para consumir el API
  enviarFormulario() {
    console.log("enviarFormulario");
    //Asignacion de campos en cabezal
    this.formulario.patchValue({
      idEmpresa: this.SelectEmpresaControl.value?.id_emp,
      estado: 'A',
      fechaMod: new Date().toISOString()
    });
    console.log("enviarFormulario");
    console.log('¿Formulario válido?', this.formulario.valid);
    console.log('Errores:', this.formulario.errors);
    console.log('Estado completo:', this.formulario);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Auditoria
    this.agregarLogAuditoria();
    console.log("OBJECTO");
    console.log(this.formulario.value);



    if (this.isEditMode) {
      //Evento Edicion
      this.categoriaService.update(this.formulario.value).subscribe({
        next: (categoriaGuardada) => {
          // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
          console.log(categoriaGuardada);

          // 4. Redirigir a la vista de lista principal.
          this.router.navigate(['/categorias']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
        }
      });
    } else {
      console.log("evento nuevo");
      console.log(this.formulario.getRawValue());
      //Evento nuevo
      this.categoriaService.save(this.formulario.getRawValue()).subscribe({
        next: (categoriaGuardada) => {
          // La notificación ya ocurrió DENTRO del servicio (paso 3 del código anterior).
          console.log(categoriaGuardada);
          this.notificacion.showSuccess('¡Categoría guardada con éxito!');

          // 2. Limpiar el formulario
          this.objeto = new Categoria();
          this.formDirective.resetForm();
          const logsArray = this.formulario.get('logs') as FormArray;
          logsArray.clear();
          // 3. (Opcional) Setear valores por defecto que no deben ser null
          /* this.formulario.patchValue({
             idEmpresa: 1,  // O el ID que estés manejando
             estado: 'A',
             subcategorias: [] // Limpiar la tabla de subcategorías
           });
           */
        },
        error: (err) => {
          console.error('Error al guardar:', err);
        }
      });
    }


  }

}
