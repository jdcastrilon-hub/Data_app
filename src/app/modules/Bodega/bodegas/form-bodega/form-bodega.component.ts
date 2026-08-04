import { Component, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Bodega } from '../../../../core/models/Bodega/Bodega';
import { Sucursal } from '../../../../core/models/General/Sucursal';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { BodegaService } from '../../../../core/services/Bodega/bodega.service';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from '../../../../core/services/core/notificaciones.service';
import { SucursalServiceService } from '../../../../core/services/General/sucursal-service.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'form-bodega',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatCheckboxModule],
  templateUrl: './form-bodega.component.html',
  styleUrl: './form-bodega.component.scss'
})
export class FormBodegaComponent {

  formulario!: FormGroup;
  titulo_form !: string;

  //parametros de entrada
  objeto!: Bodega;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  //Seleccion para sucursales.
  list_sucursal: Sucursal[] = [];
  SelectSucursalControl = new FormControl<Sucursal | null>(null, Validators.required);

  // Referencia al FormGroupDirective: resetForm() limpia también el estado
  // "submitted", que formulario.reset() no toca (por eso volvían a verse errores).
  @ViewChild('formDirective') formDirective!: NgForm;

  //constructor
  constructor(
    private fb: FormBuilder,
    private bodegaService: BodegaService,
    private sucursalService: SucursalServiceService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.objeto = new Bodega();
  }

  // Vuelve al listado. El filtro/pagina en el que se quedo la lista se restaura
  // desde BodegaListStateService (no desde el historial del navegador: se puede
  // llegar a este formulario desde cualquier otra pantalla, no solo desde la lista).
  volver(): void {
    this.router.navigate(['/bodegas']);
  }

  ngOnInit(): void {
    console.log("form Bodega")
    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      codBodega: [this.objeto.codBodega, Validators.required],
      nomBodega: [this.objeto.nomBodega, Validators.required],
      bodegaPrincipal: [this.objeto.bodegaPrincipal, Validators.required],
      manejaUbicaciones: [this.objeto.manejaUbicaciones],
      activo: [this.objeto.activo],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
      id: [this.objeto.id],
      idSucursal: [this.objeto.idSucursal, Validators.required],
    });

    // No se usa formulario.disable(): los inputs de texto usan [readonly] en la
    // plantilla (se ven normales, no apagados/grises). Los checkboxes y el select
    // de sucursal son la excepción: HTML no tiene un "readonly" real para ellos,
    // así que esos controles sí se deshabilitan individualmente.
    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.get('bodegaPrincipal')?.disable();
      this.formulario.get('manejaUbicaciones')?.disable();
      this.formulario.get('activo')?.disable();
      this.SelectSucursalControl.disable();
    }
    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // Obtener el valor del parámetro 'id'

      if (id) {
        // Si hay un ID, estamos en modo Edición
        console.log("Edicion")
        this.isEditMode = true;
        if (this.isReadOnly) {
          this.titulo_form = "DETALLE BODEGA"
        } else {
          this.titulo_form = "ACTUALIZACION BODEGA"
        }

        this.ModoEdicion(Number(id)); // Llama al método de carga

      } else {
        // Si no hay ID (p. ej., si usas esta misma ruta para crear), estamos en modo Nuevo
        console.log("Nuevo")
        this.isEditMode = false;
        this.titulo_form = "REGISTRO DE BODEGA"
        this.objeto = new Bodega();
        this.formulario.get('bodegaPrincipal')?.patchValue(true);
        this.formulario.get('manejaUbicaciones')?.patchValue(false);
        this.formulario.get('activo')?.patchValue(true);
        //Carga sucursales
        this.cargarSucursales();
      }
    });
  }

  //Metodo para cargar lista de sucursales.
  cargarSucursales(): void {
    this.sucursalService.listCombo().subscribe({
      next: (data) => {
        this.list_sucursal = data;

        // Si es metodo edicion y tengo una empresa cargada.
        //La busco en la lista que me retorno el API
        if (this.isEditMode) {
          //busco la sucursal por ID
          const sucursalSeleccinada = this.list_sucursal.find(
            sucursal => sucursal.id === this.objeto.idSucursal
          );

          if (sucursalSeleccinada) {
            this.SelectSucursalControl.setValue(sucursalSeleccinada);
          }
        } else {
          // se carga la primer sucursal por defecto
          const unicoregistro = this.list_sucursal[0];
          this.SelectSucursalControl.setValue(unicoregistro);
        }
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  /**
  * Metodo para cargar la informacion de la bodega por el (id)
  * @returns No tiene return
  */
  ModoEdicion(id: number): void {
    console.log("ModoEdicion");
    //llama el API para recuperar el objecto categoria
    this.bodegaService.getBodegaById(id).subscribe(
      (data: Bodega) => {
        console.log("Respuesta API");
        console.log(data);
        this.objeto = data; // Cargar la data de la categoría en el formulario
        this.formulario.get('id')?.patchValue(data.id);
        this.formulario.get('codBodega')?.patchValue(data.codBodega);
        this.formulario.get('nomBodega')?.patchValue(data.nomBodega);
        this.formulario.get('bodegaPrincipal')?.patchValue(data.bodegaPrincipal === 'S');
        this.formulario.get('manejaUbicaciones')?.patchValue(data.manejaUbicaciones === 'S');
        this.formulario.get('activo')?.patchValue(data.activo);
        this.cargarLogsExistentes(data.logs);

        this.cargarSucursales();

      },
      error => {
        console.error('Error al cargar la categoría:', error);
        // Opcional: Redirigir si el ID es inválido o no existe
        this.router.navigate(['/categorias']);
      }
    );
  }

  // Carga el historial de auditoria ya existente en el FormArray, para que al editar
  // se acumule (en vez de que agregarLogAuditoria() sobrescriba todo el historial).
  cargarLogsExistentes(logs: Auditoria[]): void {
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    (logs ?? []).forEach(log => {
      logsArray.push(this.fb.group({
        operacion: [log.operacion],
        usuario_mod: [log.usuario_mod],
        fecha_mod: [log.fecha_mod]
      }));
    });
  }

  enviarFormulario() {
    //Asignacion de campos en cabezal
    console.log("enviarFormulario");
    const estadoBodegaPrincipal = this.formulario.get('bodegaPrincipal')?.value;
    const estadoActivo = this.formulario.get('activo')?.value;
    console.log(estadoBodegaPrincipal);
    this.formulario.patchValue({
      idSucursal: this.SelectSucursalControl.value?.id,
      fechaMod: new Date().toISOString(),
      bodegaPrincipal: estadoBodegaPrincipal ? 'SI' : 'NO',
      manejaUbicaciones: 'N',
      activo: estadoActivo,
    });

    console.log("OBJECTO");
    console.log(this.formulario.getRawValue());

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }

    //Auditoria
    this.agregarLogAuditoria();


    if (this.isEditMode) {
      //Evento Edicion
      this.bodegaService.edit(this.formulario.getRawValue(), this.objeto.id!).subscribe({
        next: (ObjectSave) => {
          this.notificacion.showSuccess('¡Bodega editada con éxito!');
          //Redirigir a la vista de lista principal.
          this.router.navigate(['/bodegas']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar la bodega.');
        }
      });

    } else {
      //Evento nuevo
      const dataCompleta = this.formulario.getRawValue();
      const { id, ...bodyJson } = dataCompleta;
      this.bodegaService.save(bodyJson).subscribe({
        next: (ObjectSave) => {
          this.notificacion.showSuccess('¡Bodega creada con éxito!');
          // Se limpia el formulario para poder seguir registrando bodegas sin salir de la pantalla
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar la bodega.');
        }
      });
    }


  }

  // Limpia el formulario y el FormGroup para dejarlo listo para un nuevo registro.
  // La sucursal seleccionada se conserva a propósito (facilita registrar varias
  // bodegas seguidas de la misma sucursal).
  resetCampos(): void {
    this.objeto = new Bodega();
    this.formDirective.resetForm();
    this.formulario.get('bodegaPrincipal')?.patchValue(false);
    this.formulario.get('manejaUbicaciones')?.patchValue(false);
    this.formulario.get('activo')?.patchValue(false);
    this.formulario.get('idSucursal')?.patchValue(this.SelectSucursalControl.value?.id);

    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
  }

  // Muestra en un dialogo el historial de auditoria del registro actual
  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - ${this.objeto.codBodega}`,
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
