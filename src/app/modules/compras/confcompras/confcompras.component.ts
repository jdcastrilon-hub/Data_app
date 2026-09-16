import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { ComboEstadostockComponent } from '../../resources/combo-estadostock/combo-estadostock.component';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';
import { ConfCompras } from 'src/app/core/models/Compras/ConfCompras';
import { ConfcomprasService } from 'src/app/core/services/Compras/confcompras.service';
import { EstadoCombo } from 'src/app/core/interfaces/Bodega/EstadoCombo';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';

@Component({
  selector: 'app-confcompras',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FormsModule, MatSlideToggleModule, ComboEstadostockComponent],
  templateUrl: './confcompras.component.html',
  styleUrl: './confcompras.component.scss'
})
export class ConfcomprasComponent {

  formulario!: FormGroup;
  objeto!: ConfCompras;
  logs: any[] = [];

  guardando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private confcomprasService: ConfcomprasService,
    private notificacion: NotificacionesService,
    private logAuditoria: AuditoriaService,
    private dialog: MatDialog
  ) {
    this.objeto = new ConfCompras();
  }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      idEstadoComp: [null],
      actPrecioCompra: [false],
      porcUtilidadGeneral: [null]
    });

    this.cargarConfiguracion();
  }

  cargarConfiguracion(): void {
    this.confcomprasService.getConfCompras().subscribe({
      next: (data) => {
        this.objeto = data;
        this.formulario.patchValue({
          idEstadoComp: data.idEstadoComp,
          actPrecioCompra: data.actPrecioCompra,
          porcUtilidadGeneral: data.porcUtilidadGeneral
        });
        this.logs = data.logs || [];
      },
      error: (err) => {
        console.error('Error cargando la configuración de compras', err);
        this.notificacion.showError('No se pudo cargar la configuración de compras.');
      }
    });
  }

  // El combo-estadostock reusado de Compra Directa/Ajuste de Stock emite el
  // objeto completo (EstadoCombo) al elegir - solo nos interesa el id.
  onEstadoChange(estado: EstadoCombo): void {
    this.formulario.patchValue({ idEstadoComp: estado.id });
  }

  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: 'Historial de Auditoría - Configuración de Compras',
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
      idEstadoComp: valor.idEstadoComp,
      actPrecioCompra: valor.actPrecioCompra,
      porcUtilidadGeneral: valor.porcUtilidadGeneral,
      fechaMod: new Date(),
      logs: nuevosLogs
    };

    this.guardando = true;
    this.confcomprasService.save(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.logs = nuevosLogs;
        this.notificacion.showSuccess('¡Configuración de compras guardada con éxito!');
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error guardando la configuración de compras', err);
        this.notificacion.showError(err.error?.message || err.message || 'No se pudo guardar la configuración.');
      }
    });
  }
}
