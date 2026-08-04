import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { CiudadCombo } from 'src/app/core/interfaces/Core/CiudadCombo';
import { Empresas } from 'src/app/core/models/core/Empresas';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { EmpresaServiceService } from 'src/app/core/services/core/empresa-service.service';
import { CiudadesService } from 'src/app/core/services/core/ciudades.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

// Codigo del formulario en md_menu (matriz de permisos)
const MENU_CODIGO = 'ADM_EMP';

@Component({
  selector: 'app-mi-empresa',
  imports: [modules_depencias, ReactiveFormsModule, FormsModule, FlexLayoutModule, MatCheckboxModule],
  templateUrl: './mi-empresa.component.html',
  styleUrl: './mi-empresa.component.scss'
})
export class MiEmpresaComponent {

  formulario!: FormGroup;
  objeto!: Empresas;

  // A diferencia de los demas formularios, este no navega entre rutas new/view/edit
  // (es un solo registro por empresa) - arranca en modo Ver y un lapiz lo pasa a edicion.
  isReadOnly = true;
  puedeEditar = false;
  cargando = true;

  //Ciudad
  list_ciudades: CiudadCombo[] = [];
  SelecCiudadControl = new FormControl<CiudadCombo | null>(null, Validators.required);

  constructor(
    private fb: FormBuilder,
    private service: EmpresaServiceService,
    private ciudadService: CiudadesService,
    private logAuditoria: AuditoriaService,
    private notificacion: NotificacionesService,
    private permisosState: PermisosStateService,
    private dialog: MatDialog
  ) {
    this.objeto = new Empresas();
  }

  ngOnInit() {
    this.formulario = this.fb.group({
      nomEmp: [{ value: '', disabled: true }, Validators.required],
      razonSocial: [{ value: '', disabled: true }, Validators.required],
      codDoc: [{ value: '', disabled: true }, Validators.required],
      nit: [{ value: '', disabled: true }, Validators.required],
      direccion: [{ value: '', disabled: true }, Validators.required],
      codCiudad: [{ value: null, disabled: true }, Validators.required],
      telefono: [{ value: '', disabled: true }, Validators.required],
      correo: [{ value: '', disabled: true }, Validators.required],
      fechaMod: [null],
      logs: this.fb.array([])
    });
    this.SelecCiudadControl.disable({ emitEvent: false });

    this.permisosState.cargar().subscribe(() => {
      this.puedeEditar = this.permisosState.tienePermiso(MENU_CODIGO, 'EDITAR');
    });

    this.CargaCiudades();
    this.cargarEmpresa();

    this.SelecCiudadControl.valueChanges.subscribe(ciudad => {
      this.formulario.get('codCiudad')?.setValue(ciudad?.idCiudad ?? null);
    });
  }

  cargarEmpresa(): void {
    this.cargando = true;
    this.service.getMiEmpresa().subscribe({
      next: (data: Empresas) => {
        this.objeto = data;
        this.formulario.patchValue({
          nomEmp: data.nomEmp,
          razonSocial: data.razonSocial,
          codDoc: data.codDoc,
          nit: data.nit,
          direccion: data.direccion,
          codCiudad: data.codCiudad,
          telefono: data.telefono,
          correo: data.correo,
        });
        this.sincronizarCiudad(data.codCiudad);
        this.cargarLogsExistentes(data.logs ?? []);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar la empresa:', err);
        this.notificacion.showError('No se pudo cargar la información de la empresa.');
        this.cargando = false;
      }
    });
  }

  CargaCiudades(): void {
    this.ciudadService.listSelection().subscribe({
      next: (data) => {
        this.list_ciudades = data;
        this.sincronizarCiudad(this.formulario.get('codCiudad')?.value);
      },
      error: (err) => console.error('Error cargando ciudades', err)
    });
  }

  private sincronizarCiudad(idCiudad: number | null | undefined): void {
    const seleccionada = this.list_ciudades.find(c => c.idCiudad === idCiudad);
    if (seleccionada) {
      this.SelecCiudadControl.setValue(seleccionada, { emitEvent: false });
    }
  }

  activarEdicion(): void {
    this.isReadOnly = false;
    this.formulario.enable({ emitEvent: false });
    this.SelecCiudadControl.enable({ emitEvent: false });
  }

  cancelarEdicion(): void {
    this.isReadOnly = true;
    this.cargarEmpresa();
    this.formulario.disable({ emitEvent: false });
    this.SelecCiudadControl.disable({ emitEvent: false });
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
        titulo: `Historial de Auditoría - ${this.objeto.nomEmp}`,
        logs: this.formulario.get('logs')?.value
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }

  agregarLogAuditoria() {
    const logData = this.logAuditoria.generarLog('Edicion');

    const auditoriaGroup = this.fb.group({
      operacion: [logData.operacion],
      usuario_mod: [logData.usuario_mod],
      fecha_mod: [logData.fecha_mod]
    });

    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.push(auditoriaGroup);
  }

  guardar(): void {
    this.formulario.patchValue({
      fechaMod: new Date().toISOString()
    });

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.agregarLogAuditoria();

    const jsonParaAPI = this.formulario.getRawValue();

    this.service.updateMiEmpresa(jsonParaAPI).subscribe({
      next: () => {
        this.notificacion.showSuccess('¡Datos de la empresa actualizados con éxito!');
        this.isReadOnly = true;
        this.formulario.disable({ emitEvent: false });
        this.SelecCiudadControl.disable({ emitEvent: false });
        this.cargarEmpresa();
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.notificacion.showError(err.error?.message || 'No se pudo actualizar la empresa.');
      }
    });
  }

}
