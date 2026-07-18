import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { SucursalCombo } from 'src/app/core/interfaces/Core/SucursalCombo';
import { DocumentoVenta } from 'src/app/core/models/Ventas/DocumentoVenta';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { DocumentosVentaService } from 'src/app/core/services/Ventas/documentos-venta.service';
import { SucursalServiceService } from 'src/app/core/services/General/sucursal-service.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

@Component({
  selector: 'app-form-documento-venta',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatCheckboxModule],
  templateUrl: './form-documento-venta.component.html',
  styleUrl: './form-documento-venta.component.scss'
})
export class FormDocumentoVentaComponent {

  formulario!: FormGroup;
  objeto!: DocumentoVenta;
  titulo_form: string = 'REGISTRO DE DOCUMENTO DE VENTA';
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  // Llave compuesta original (antes de editar), para saber que fila actualizar/eliminar.
  idSucursalOriginal!: number;
  documentoOriginal!: string;

  //Seleccion para sucursales.
  list_sucursal: SucursalCombo[] = [];
  SelectSucursalControl = new FormControl<SucursalCombo | null>(null, Validators.required);

  @ViewChild('formDirective') formDirective!: NgForm;

  constructor(private fb: FormBuilder,
    private documentosService: DocumentosVentaService,
    private sucursalService: SucursalServiceService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router) {
    this.objeto = new DocumentoVenta();
  }

  volver(): void {
    this.router.navigate(['/documentos-venta']);
  }

  ngOnInit() {
    // idEmpresa no se pide en el formulario: se toma de la sesion (LoginService)
    // al crear/editar, ver enviarFormulario() - mismo patron que estados/mediospago.
    this.formulario = this.fb.group({
      idEmpresa: [this.objeto.idEmpresa],
      idSucursal: [this.objeto.idSucursal],
      documento: [this.objeto.documento, Validators.required],
      descripcion: [this.objeto.descripcion, Validators.required],
      serie: [this.objeto.serie, Validators.required],
      clase: [this.objeto.clase, Validators.required],
      secuencia: [this.objeto.secuencia, Validators.required],
      aplicaPos: [false],
      activo: [true],
      fechaMod: [this.objeto.fechaMod],
      logs: this.fb.array([])
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.disable();
    }

    this.cargarSucursales();

    this.SelectSucursalControl.valueChanges.subscribe(objectoSucursal => {
      if (objectoSucursal) {
        this.formulario.patchValue({ idSucursal: objectoSucursal.id });
      }
    });

    //Validacion si es modo edicion o nuevo
    this.route.paramMap.subscribe(params => {
      const idSucursal = params.get('idSucursal');
      const documento = params.get('documento');

      if (idSucursal && documento) {
        this.isEditMode = true;
        this.idSucursalOriginal = Number(idSucursal);
        this.documentoOriginal = documento;
        this.titulo_form = this.isReadOnly ? 'DETALLE DOCUMENTO DE VENTA' : 'ACTUALIZACION DOCUMENTO DE VENTA';
        this.ModoEdicion(this.idSucursalOriginal, this.documentoOriginal);
      } else {
        this.isEditMode = false;
        this.titulo_form = 'REGISTRO DE DOCUMENTO DE VENTA';
        this.objeto = new DocumentoVenta();
        this.formulario.patchValue({ idEmpresa: this.loginService.getIdEmpresaActual() });
      }
    });
  }

  cargarSucursales(): void {
    this.sucursalService.sucursalesxBodegas().subscribe({
      next: (data) => {
        this.list_sucursal = data;

        if (this.isEditMode && this.objeto.idSucursal) {
          const sucursalSeleccionada = this.list_sucursal.find(s => s.id === this.objeto.idSucursal);
          if (sucursalSeleccionada) {
            this.SelectSucursalControl.setValue(sucursalSeleccionada);
          }
        } else if (!this.isEditMode && this.list_sucursal.length === 1) {
          this.SelectSucursalControl.setValue(this.list_sucursal[0]);
        }
      },
      error: (err) => {
        console.error('Error cargando sucursales', err);
      }
    });
  }

  ModoEdicion(idSucursal: number, documento: string): void {
    this.documentosService.getDocumentoById(idSucursal, documento).subscribe({
      next: (data: DocumentoVenta) => {
        this.objeto = data;

        this.cargarLogsExistentes(data.logs);

        this.formulario.patchValue({
          idEmpresa: data.idEmpresa,
          idSucursal: data.idSucursal,
          documento: data.documento,
          descripcion: data.descripcion,
          serie: data.serie,
          clase: data.clase,
          secuencia: data.secuencia,
          aplicaPos: data.aplicaPos === 'S',
          activo: data.activo === 'S'
        });

        // Sucursal ya cargada (o se carga en paralelo): intenta preseleccionar ahora
        // y de nuevo cuando cargarSucursales() resuelva si aun no estaba lista.
        const sucursalSeleccionada = this.list_sucursal.find(s => s.id === data.idSucursal);
        if (sucursalSeleccionada) {
          this.SelectSucursalControl.setValue(sucursalSeleccionada);
        }
      },
      error: (err) => {
        console.error('Error al cargar el documento de venta:', err);
        this.router.navigate(['/documentos-venta']);
      }
    });
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

  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - ${this.objeto.documento}`,
        logs: this.formulario.get('logs')?.value
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
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

  enviarFormulario() {
    this.formulario.patchValue({
      idEmpresa: this.loginService.getIdEmpresaActual(),
      fechaMod: new Date().toISOString()
    });

    if (this.formulario.invalid || !this.SelectSucursalControl.value) {
      this.formulario.markAllAsTouched();
      this.SelectSucursalControl.markAsTouched();
      return;
    }

    this.agregarLogAuditoria();

    const dataCompleta = this.formulario.getRawValue();
    const jsonParaAPI = {
      ...dataCompleta,
      aplicaPos: dataCompleta.aplicaPos ? 'S' : 'N',
      activo: dataCompleta.activo ? 'S' : 'N'
    };

    if (this.isEditMode) {
      this.documentosService.edit(this.idSucursalOriginal, this.documentoOriginal, jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Documento de venta actualizado con éxito!');
          this.router.navigate(['/documentos-venta']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar el documento de venta.');
        }
      });
    } else {
      this.documentosService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Documento de venta guardado con éxito!');
          this.resetCampos();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar el documento de venta.');
        }
      });
    }
  }

  resetCampos() {
    this.objeto = new DocumentoVenta();
    this.formDirective.resetForm();
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.clear();
    this.formulario.patchValue({
      idEmpresa: this.loginService.getIdEmpresaActual(),
      aplicaPos: false,
      activo: true
    });
  }

}
