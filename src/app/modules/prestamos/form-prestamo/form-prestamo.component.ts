import { Component, inject } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ComboClienteComponent } from 'src/app/modules/resources/combo-cliente/combo-cliente.component';
import { ComboUsuarioComponent } from 'src/app/modules/resources/combo-usuario/combo-usuario.component';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';

import { PrestamoService } from 'src/app/core/services/Prestamos/prestamo.service';
import { PeriodicidadService } from 'src/app/core/services/Prestamos/periodicidad.service';
import { FormulaprestamoService } from 'src/app/core/services/Prestamos/formulaprestamo.service';
import { MonedaService } from 'src/app/core/services/Prestamos/moneda.service';
import { MediospagoService } from 'src/app/core/services/Ventas/mediospago.service';
import { CajasService } from 'src/app/core/services/Ventas/cajas.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';

import { Prestamo } from 'src/app/core/models/Prestamos/Prestamo';
import { PeriodicidadCombo } from 'src/app/core/interfaces/Prestamos/PeriodicidadCombo';
import { FormulaPrestamoCombo } from 'src/app/core/interfaces/Prestamos/FormulaPrestamoCombo';
import { MonedaCombo } from 'src/app/core/interfaces/Prestamos/MonedaCombo';
import { MedioPago } from 'src/app/core/models/Ventas/medioPago';
import { CajaCombo } from 'src/app/core/interfaces/Comercial/CajaCombo';
import { ClienteSearch } from 'src/app/core/interfaces/Comercial/ClienteSearch';
import { UsuarioSearch } from 'src/app/core/interfaces/Core/UsuarioSearch';

// Datos para abrir este mismo formulario como modal de consulta (ej. desde el
// Monitor de Prestamos), en vez de por ruta /prestamos/view/:id.
export interface FormPrestamoDialogData {
  idTrans: number;
}

@Component({
  selector: 'form-prestamo',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FormsModule, FlexLayoutModule, RouterModule,
    MatDatepickerModule, ComboClienteComponent, ComboUsuarioComponent],
  templateUrl: './form-prestamo.component.html',
  styleUrl: './form-prestamo.component.scss'
})
export class FormPrestamoComponent {

  formulario!: FormGroup;
  objeto: Prestamo = new Prestamo();
  isReadOnly: boolean = false;
  titulo_form: string = '';
  logs: any[] = [];

  list_periodicidades: PeriodicidadCombo[] = [];
  list_formulas: FormulaPrestamoCombo[] = [];
  list_monedas: MonedaCombo[] = [];
  list_mediospago: MedioPago[] = [];
  list_cajas: CajaCombo[] = [];

  cobradorSeleccionado: UsuarioSearch | null = null;

  // Previsualizacion en pantalla - el backend siempre recalcula, nunca se
  // envia este valor (mismo criterio que "no confiar en el cliente").
  valorCuotaPreview: number | null = null;
  fecFinPreview: Date | null = null;

  guardando: boolean = false;

  // Presentes solo cuando el form se abre con MatDialog; por ruta quedan null
  // y el componente se comporta exactamente como antes.
  private dialogData = inject<FormPrestamoDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject<MatDialogRef<FormPrestamoComponent> | null>(MatDialogRef, { optional: true });
  enModal: boolean = !!this.dialogData;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private prestamoService: PrestamoService,
    private periodicidadService: PeriodicidadService,
    private formulaprestamoService: FormulaprestamoService,
    private monedaService: MonedaService,
    private mediospagoService: MediospagoService,
    private cajasService: CajasService,
    private loginService: LoginService,
    private notificacion: NotificacionesService,
    private logAuditoria: AuditoriaService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    // Como modal siempre es consulta del contrato recibido; por ruta, el modo
    // sale de la URL (new vs view/:id) como en el resto de formularios.
    this.isReadOnly = this.enModal || this.router.url.includes('/view');
    const id = this.enModal ? String(this.dialogData!.idTrans) : this.route.snapshot.paramMap.get('id');
    // Fase 1: sin edicion todavia (un contrato ya desembolsado no se toca
    // directamente, ver spec) - solo existen los estados "nuevo" y "detalle".
    this.titulo_form = id ? 'DETALLE PRÉSTAMO' : 'REGISTRO PRÉSTAMO';

    // No hay campo "Tipo Cuenta" ni select de Banco: de donde sale el dinero
    // se resuelve directo del medio de pago elegido (id_mediopago.idBanco) -
    // ver medioPagoSeleccionado/medioPagoTieneBanco. idCaja solo se pide
    // cuando el medio no trae banco (Efectivo).
    this.formulario = this.fb.group({
      searchCliente: [null],
      idCliente: [null, Validators.required],
      fecDesembolso: [new Date(), Validators.required],
      capital: [null, [Validators.required, Validators.min(1)]],
      numCuotas: [null, [Validators.required, Validators.min(1), Validators.max(99)]],
      tasaPct: [0, [Validators.required, Validators.min(0)]],
      idCaja: [null],
      idMediopago: [null, Validators.required],
      idPeriodicidad: [null, Validators.required],
      idFormula: [null, Validators.required],
      idMoneda: [null],
      searchCobrador: [null],
      observacion: [null]
    });

    this.periodicidadService.listCombo().subscribe(data => {
      this.list_periodicidades = data;
      // Autoseleccion si la empresa solo tiene 1 habilitada - ver spec.
      if (data.length === 1 && !id) {
        this.formulario.patchValue({ idPeriodicidad: data[0].id });
      }
      this.recalcularPreview();
    });

    this.formulaprestamoService.listCombo().subscribe(data => {
      this.list_formulas = data;
      if (data.length === 1 && !id) {
        this.formulario.patchValue({ idFormula: data[0].id });
      }
    });

    this.monedaService.listCombo().subscribe(data => {
      this.list_monedas = data;
      if (data.length === 1 && !id) {
        this.formulario.patchValue({ idMoneda: data[0].id });
      }
    });

    this.mediospagoService.list().subscribe(data => this.list_mediospago = data);

    const usuarioActual = this.loginService.getUsuarioActual();
    if (usuarioActual) {
      this.cajasService.porUsuario(usuarioActual.idUsuario).subscribe(data => this.list_cajas = data);
      // Cobrador por defecto = usuario logueado (quien origina el prestamo
      // normalmente es quien lo cobra) - el usuario lo puede cambiar eligiendo
      // otro en el combo. Solo aplica a un prestamo nuevo, no pisa el cobrador
      // real guardado al ver uno existente.
      if (!id) {
        const cobradorDefault: UsuarioSearch = { idUsuario: usuarioActual.idUsuario, usuario: usuarioActual.usuario, nombreCompleto: usuarioActual.nombre };
        this.cobradorSeleccionado = cobradorDefault;
        this.formulario.patchValue({ searchCobrador: cobradorDefault }, { emitEvent: false });
      }
    }

    if (id) {
      this.prestamoService.getById(+id).subscribe(data => this.cargarDatos(data));
    }

    this.formulario.valueChanges.subscribe(() => this.recalcularPreview());
  }

  // Medio de pago elegido - null hasta que el usuario seleccione uno.
  get medioPagoSeleccionado(): MedioPago | undefined {
    return this.list_mediospago.find(mp => mp.id === this.formulario?.get('idMediopago')?.value);
  }

  // true = el medio de pago ya trae su banco (Transferencia/Tarjeta), asi que
  // no hace falta pedir Caja; false = medio tipo Efectivo, se pide Caja.
  get medioPagoTieneBanco(): boolean {
    return !!this.medioPagoSeleccionado?.idBanco;
  }

  // Lee el objeto completo que emite combo-cliente y solo se queda con el id
  // real (mismo patron que form-devolucion-venta).
  onClienteChange(cliente: ClienteSearch | null): void {
    this.formulario.patchValue({ idCliente: cliente?.idCliente ?? null });
  }

  onCobradorChange(usuario: UsuarioSearch | null): void {
    this.cobradorSeleccionado = usuario;
  }

  cerrarModal(): void {
    this.dialogRef?.close();
  }

  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - PRESTAMO-${this.objeto.nroDocum}`,
        logs: this.logs
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }

  // Preview informativo - refleja exactamente la formula FIJO_CAPITAL_ORIGINAL
  // que hoy calcula el backend (repository_prestamo._calcular_valor_cuota).
  recalcularPreview(): void {
    const v = this.formulario.value;

    if (v.capital && v.numCuotas && v.tasaPct != null) {
      this.valorCuotaPreview = (v.capital / v.numCuotas) + (v.capital * (v.tasaPct / 100));
    } else {
      this.valorCuotaPreview = null;
    }

    const periodicidad = this.list_periodicidades.find(p => p.id === v.idPeriodicidad);
    if (v.fecDesembolso && v.numCuotas && periodicidad) {
      const fin = new Date(v.fecDesembolso);
      fin.setDate(fin.getDate() + periodicidad.dias * v.numCuotas);
      this.fecFinPreview = fin;
    } else {
      this.fecFinPreview = null;
    }
  }

  private cargarDatos(data: Prestamo): void {
    this.objeto = data;
    this.logs = data.logs || [];
    // Se completa aqui (no en ngOnInit) porque el numero solo se conoce
    // despues de cargar el contrato - antes de esto el titulo queda con el
    // texto generico "DETALLE PRESTAMO".
    this.titulo_form = `DETALLE PRÉSTAMO # ${data.nroDocum}`;
    this.formulario.patchValue({
      idCliente: data.idCliente,
      searchCliente: { idCliente: data.idCliente, codTit: '', nombreCompleto: data.clienteNombre || '' },
      fecDesembolso: data.fecDesembolso,
      capital: data.capital,
      numCuotas: data.numCuotas,
      tasaPct: data.tasaPct,
      idCaja: data.idCaja,
      idMediopago: data.idMediopago,
      idPeriodicidad: data.idPeriodicidad,
      idFormula: data.idFormula,
      idMoneda: data.idMoneda,
      observacion: data.observacion
    }, { emitEvent: false });

    if (data.idCobrador && data.cobrador) {
      const cobrador: UsuarioSearch = { idUsuario: data.idCobrador, usuario: '', nombreCompleto: data.cobrador.nombreCompleto };
      this.cobradorSeleccionado = cobrador;
      this.formulario.patchValue({ searchCobrador: cobrador }, { emitEvent: false });
    }

    this.recalcularPreview();

    if (this.isReadOnly) {
      this.formulario.disable();
    }
  }

  guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      this.notificacion.showError('Revisa los campos marcados antes de guardar.');
      return;
    }

    const v = this.formulario.value;
    if (!this.medioPagoTieneBanco && !v.idCaja) {
      this.notificacion.showError('Selecciona la caja de la que sale el dinero.');
      return;
    }

    const logData = this.logAuditoria.generarLog('Nuevo');
    const nuevosLogs = [...this.logs, logData];
    const payload = {
      idCliente: v.idCliente,
      fecDesembolso: v.fecDesembolso,
      capital: v.capital,
      numCuotas: v.numCuotas,
      tasaPct: v.tasaPct,
      // idBanco NO se manda: el backend lo deriva de idMediopago (ver
      // repository_prestamo._resolver_caja_banco) - nunca se confia en un
      // valor de origen bancario que mande el cliente.
      idCaja: this.medioPagoTieneBanco ? null : v.idCaja,
      idMediopago: v.idMediopago,
      idPeriodicidad: v.idPeriodicidad,
      idFormula: v.idFormula,
      idCobrador: this.cobradorSeleccionado?.idUsuario ?? null,
      idMoneda: v.idMoneda,
      observacion: v.observacion,
      fechaMod: new Date(),
      logs: nuevosLogs
    };

    this.guardando = true;
    this.prestamoService.save(payload).subscribe({
      next: (data) => {
        this.guardando = false;
        this.logs = nuevosLogs;
        this.notificacion.showSuccess('¡Préstamo originado con éxito!');
        this.router.navigate(['/prestamos/view', data.idTrans]);
      },
      error: (err) => {
        this.guardando = false;
        this.notificacion.showError(err.error?.message || err.message || 'No se pudo originar el préstamo.');
      }
    });
  }
}
