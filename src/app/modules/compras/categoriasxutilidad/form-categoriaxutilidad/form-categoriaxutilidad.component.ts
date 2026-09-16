import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { CategoriaXUtilidad } from '../../../../core/models/Compras/CategoriaXUtilidad';
import { Auditoria } from '../../../../core/models/core/Auditoria';
import { CategoriaxutilidadService } from '../../../../core/services/Compras/categoriaxutilidad.service';
import { CategoriaService } from 'src/app/core/services/Bodega/categoria.service';
import { CategoriaCombo } from 'src/app/core/interfaces/Bodega/CategoriaCombo';
import { SubcategoriaCombo } from 'src/app/core/interfaces/Bodega/SubcategoriaCombo';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'form-categoriaxutilidad',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatCheckboxModule],
  templateUrl: './form-categoriaxutilidad.component.html',
  styleUrl: './form-categoriaxutilidad.component.scss'
})
export class FormCategoriaxutilidadComponent {

  formulario!: FormGroup;
  titulo_form!: string;

  objeto!: CategoriaXUtilidad;
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  list_categorias: CategoriaCombo[] = [];
  list_subcategorias: SubcategoriaCombo[] = [];

  SelectCategoriaControl = new FormControl<CategoriaCombo | null>(null, Validators.required);
  // null = "Toda la categoría" (opcion explicita del combo, ver template) - no
  // es "todavia sin elegir", es una decision valida en si misma.
  SelectSubcategoriaControl = new FormControl<SubcategoriaCombo | null>(null);

  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(
    private fb: FormBuilder,
    private service: CategoriaxutilidadService,
    private categoriaService: CategoriaService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.objeto = new CategoriaXUtilidad();
  }

  volver(): void {
    this.router.navigate(['/utilidadxcategoria']);
  }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      id: [this.objeto.id],
      idEmp: [this.objeto.idEmp],
      idCategoria: [this.objeto.idCategoria, Validators.required],
      idSubcategoria: [this.objeto.idSubcategoria],
      porcUtilidad: [0, [Validators.required, Validators.min(0)]],
      activo: [true],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([]),
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.disable();
      this.SelectCategoriaControl.disable();
      this.SelectSubcategoriaControl.disable();
    }

    this.categoriaService.listSelection().subscribe({
      next: (data) => this.list_categorias = data,
      error: (err) => console.error('Error cargando categorias', err)
    });

    // Al cambiar la categoria se recarga la lista de subcategorias (cascada) y
    // se resetea la subcategoria elegida - una subcategoria de la categoria
    // anterior ya no tiene sentido con la nueva.
    this.SelectCategoriaControl.valueChanges.subscribe(categoria => {
      this.formulario.patchValue({ idCategoria: categoria?.id ?? null });
      this.SelectSubcategoriaControl.setValue(null);
      this.list_subcategorias = [];

      if (categoria) {
        this.categoriaService.listSubcategorias(categoria.id).subscribe({
          next: (data) => this.list_subcategorias = data,
          error: (err) => console.error('Error cargando subcategorias', err)
        });
      }
    });

    this.SelectSubcategoriaControl.valueChanges.subscribe(subcategoria => {
      this.formulario.patchValue({ idSubcategoria: subcategoria?.id ?? null });
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE UTILIDAD X CATEGORÍA' : 'ACTUALIZACIÓN UTILIDAD X CATEGORÍA';
        this.ModoEdicion(Number(id));
      } else {
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO DE UTILIDAD X CATEGORÍA';
        this.objeto = new CategoriaXUtilidad();
        this.formulario.get('activo')?.patchValue(true);
      }
    });
  }

  ModoEdicion(id: number): void {
    this.service.getById(id).subscribe(
      (data: CategoriaXUtilidad) => {
        this.objeto = data;
        this.formulario.patchValue({
          id: data.id,
          idEmp: data.idEmp,
          idCategoria: data.idCategoria,
          idSubcategoria: data.idSubcategoria,
          porcUtilidad: data.porcUtilidad,
          activo: data.activo,
        });
        this.cargarLogsExistentes(data.logs);

        // Preseleccionar Categoria (y, en cascada, Subcategoria) una vez la
        // lista de categorias ya este cargada.
        this.categoriaService.listSelection().subscribe(categorias => {
          this.list_categorias = categorias;
          const categoriaEncontrada = categorias.find(c => c.id === data.idCategoria);
          if (categoriaEncontrada) {
            this.SelectCategoriaControl.setValue(categoriaEncontrada, { emitEvent: false });

            this.categoriaService.listSubcategorias(categoriaEncontrada.id).subscribe(subcategorias => {
              this.list_subcategorias = subcategorias;
              if (data.idSubcategoria != null) {
                const subcategoriaEncontrada = subcategorias.find(s => s.id === data.idSubcategoria);
                if (subcategoriaEncontrada) {
                  this.SelectSubcategoriaControl.setValue(subcategoriaEncontrada, { emitEvent: false });
                }
              }
            });
          }
        });

        if (this.isReadOnly) {
          this.SelectCategoriaControl.disable();
          this.SelectSubcategoriaControl.disable();
        }
      },
      error => {
        console.error('Error al cargar la configuración de utilidad:', error);
        this.router.navigate(['/utilidadxcategoria']);
      }
    );
  }

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

  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: 'Historial de Auditoría - Utilidad x Categoría',
        logs: this.formulario.get('logs')?.value
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }

  enviarFormulario() {
    this.formulario.patchValue({
      idEmp: this.loginService.getIdEmpresaActual(),
      fechaMod: new Date().toISOString(),
    });

    this.SelectCategoriaControl.markAsTouched();
    if (this.formulario.invalid || this.SelectCategoriaControl.invalid) {
      this.formulario.markAllAsTouched();
      this.notificacion.showError('Revisa los campos marcados antes de guardar.');
      return;
    }

    this.agregarLogAuditoria();

    if (this.isEditMode) {
      this.service.edit(this.formulario.getRawValue(), this.objeto.id).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Configuración editada con éxito!');
          this.router.navigate(['/utilidadxcategoria']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || err.error?.detail || 'No se pudo editar la configuración.');
        }
      });
    } else {
      const dataCompleta = this.formulario.getRawValue();
      const { id, ...bodyJson } = dataCompleta;
      this.service.save(bodyJson).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Configuración creada con éxito!');
          // Se queda en el formulario (limpio) para seguir agregando reglas -
          // es habitual configurar varias categorias/subcategorias seguidas.
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || err.error?.detail || 'No se pudo guardar la configuración.');
        }
      });
    }
  }

  // Limpia el formulario y lo deja listo para registrar otra regla sin salir
  // de la pantalla.
  resetCampos(): void {
    this.objeto = new CategoriaXUtilidad();
    this.formDirective.resetForm();
    this.SelectCategoriaControl.setValue(null);
    this.SelectSubcategoriaControl.setValue(null);
    this.list_subcategorias = [];
    this.formulario.get('activo')?.patchValue(true);

    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
  }

  agregarLogAuditoria() {
    const logData = this.logAuditoria.generarLog(!this.isEditMode ? 'Nuevo' : 'Edicion');

    const auditoriaGroup = this.fb.group({
      operacion: [logData.operacion],
      usuario_mod: [logData.usuario_mod],
      fecha_mod: [logData.fecha_mod]
    });

    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.push(auditoriaGroup);
  }

}
