import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';
import { ConfComercial } from 'src/app/core/models/Ventas/ConfComercial';
import { ConfcomercialService } from 'src/app/core/services/Ventas/confcomercial.service';
import { RolService } from 'src/app/core/services/core/rol.service';
import { RolCombo } from 'src/app/core/interfaces/Core/PermisosMatriz';
import { BodegaService } from 'src/app/core/services/Bodega/bodega.service';
import { BodegaCombo } from 'src/app/core/interfaces/Bodega/BodegaCombo';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';

@Component({
  selector: 'app-confcomercial',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FormsModule, MatSlideToggleModule],
  templateUrl: './confcomercial.component.html',
  styleUrl: './confcomercial.component.scss'
})
export class ConfcomercialComponent {

  formulario!: FormGroup;
  objeto!: ConfComercial;
  logs: any[] = [];

  list_roles: RolCombo[] = [];
  list_bodegas: BodegaCombo[] = [];

  // Picker para agregar una fila nueva a la grilla de descuento por rol.
  SelecRolControl = new FormControl<RolCombo | null>(null);
  nuevoMaxDescuento: number = 0;

  guardando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private confcomercialService: ConfcomercialService,
    private rolService: RolService,
    private bodegaService: BodegaService,
    private notificacion: NotificacionesService,
    private logAuditoria: AuditoriaService,
    private dialog: MatDialog
  ) {
    this.objeto = new ConfComercial();
  }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      precioCeroEditable: [false],
      reimpresionFacturaPermitida: [false],
      idBodegaDevoluciones: [null],
      rolesDescuento: this.fb.array([])
    });

    this.rolService.listCombo().subscribe({
      next: (data) => this.list_roles = data,
      error: (err) => console.error('Error cargando roles', err)
    });
    this.bodegaService.listSelection().subscribe({
      next: (data) => this.list_bodegas = data,
      error: (err) => console.error('Error cargando bodegas', err)
    });

    this.cargarConfiguracion();
  }

  get rolesDescuentoArray(): FormArray {
    return this.formulario.get('rolesDescuento') as FormArray;
  }

  // Roles que todavia no estan en la grilla - para no dejar agregar el mismo
  // rol dos veces (deny by default: un rol ausente ya queda sin permiso, no
  // tiene sentido tener dos filas para el mismo rol).
  get rolesDisponiblesParaAgregar(): RolCombo[] {
    const yaAgregados = new Set(this.rolesDescuentoArray.controls.map(c => c.value.idRol));
    return this.list_roles.filter(r => !yaAgregados.has(r.idRol));
  }

  cargarConfiguracion(): void {
    this.confcomercialService.getConfComercial().subscribe({
      next: (data) => {
        this.objeto = data;
        this.formulario.patchValue({
          precioCeroEditable: data.precioCeroEditable,
          reimpresionFacturaPermitida: data.reimpresionFacturaPermitida,
          idBodegaDevoluciones: data.idBodegaDevoluciones
        });
        this.logs = data.logs || [];

        this.rolesDescuentoArray.clear();
        (data.rolesDescuento || []).forEach(item => this.agregarFilaRol(item.idRol, item.rol?.nombre || '', item.maxDescuento));
      },
      error: (err) => {
        console.error('Error cargando la configuración comercial', err);
        this.notificacion.showError('No se pudo cargar la configuración comercial.');
      }
    });
  }

  private agregarFilaRol(idRol: number, nombreRol: string, maxDescuento: number): void {
    this.rolesDescuentoArray.push(this.fb.group({
      idRol: [idRol, Validators.required],
      nombreRol: [nombreRol],
      maxDescuento: [maxDescuento, [Validators.required, Validators.min(0), Validators.max(100)]]
    }));
  }

  // Agrega el rol elegido en el picker de arriba de la grilla.
  agregarRolElegido(): void {
    const rol = this.SelecRolControl.value;
    if (!rol) {
      this.notificacion.showError('Selecciona un rol antes de agregarlo.');
      return;
    }
    this.agregarFilaRol(rol.idRol, rol.nombre, this.nuevoMaxDescuento || 0);
    this.SelecRolControl.setValue(null);
    this.nuevoMaxDescuento = 0;
  }

  eliminarFilaRol(index: number): void {
    this.rolesDescuentoArray.removeAt(index);
  }

  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: 'Historial de Auditoría - Configuración Comercial',
        logs: this.logs
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }

  guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      this.notificacion.showError('Revisa los campos marcados antes de guardar.');
      return;
    }

    const logData = this.logAuditoria.generarLog(this.objeto.idEmp ? 'Edicion' : 'Nuevo');
    const nuevosLogs = [...this.logs, logData];

    const valor = this.formulario.value;
    const payload = {
      precioCeroEditable: valor.precioCeroEditable,
      reimpresionFacturaPermitida: valor.reimpresionFacturaPermitida,
      idBodegaDevoluciones: valor.idBodegaDevoluciones,
      fechaMod: new Date(),
      logs: nuevosLogs,
      rolesDescuento: (valor.rolesDescuento as any[]).map(r => ({
        idRol: r.idRol,
        maxDescuento: r.maxDescuento
      }))
    };

    this.guardando = true;
    this.confcomercialService.save(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.logs = nuevosLogs;
        this.notificacion.showSuccess('¡Configuración comercial guardada con éxito!');
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error guardando la configuración comercial', err);
        this.notificacion.showError(err.error?.message || err.message || 'No se pudo guardar la configuración.');
      }
    });
  }
}
