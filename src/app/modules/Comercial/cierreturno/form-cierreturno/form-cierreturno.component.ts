import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatTableDataSource } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { CierreTurnoService } from 'src/app/core/services/Ventas/cierreturno.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AbrirturnoService } from 'src/app/core/services/Ventas/abrirturno.service';
import { ResumenCierreLinea } from 'src/app/core/interfaces/Comercial/ResumenCierreLinea';
import { DetalleConceptoLinea } from 'src/app/core/interfaces/Comercial/DetalleConceptoLinea';
import { DetalleConceptoComponent } from '../detalle-concepto/detalle-concepto.component';

@Component({
  selector: 'app-form-cierreturno',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, RouterModule, MatDatepickerModule, MatTooltipModule, DetalleConceptoComponent],
  templateUrl: './form-cierreturno.component.html',
  styleUrl: './form-cierreturno.component.scss'
})
export class FormCierreturnoComponent {

  formulario!: FormGroup;
  titulo_form: string = 'CIERRE DE TURNO';
  isReadOnly: boolean = false;
  idTurno: number = 0;
  nomCaja: string = '';
  usuarioTurno: string = '';

  dataSource = new MatTableDataSource<FormGroup>();
  displayedColumns: string[] = ['concepto', 'medioPago', 'importeSistema', 'valorUsuario', 'diferencia', 'acciones'];

  // Nivel 2 (drill-down): facturas detras de la fila de concepto seleccionada.
  conceptoSeleccionado: number | null = null;
  lineasDetalle: DetalleConceptoLinea[] = [];
  cargandoDetalle: boolean = false;

  constructor(
    private fb: FormBuilder,
    private cierreService: CierreTurnoService,
    private route: ActivatedRoute,
    private router: Router,
    private notificacion: NotificacionesService,
    private logAuditoria: AuditoriaService,
    private loginService: LoginService,
    private turnoService: AbrirturnoService
  ) { }

  ngOnInit() {
    this.formulario = this.fb.group({
      idTrans: [null],
      idEmp: [this.loginService.getIdEmpresaActual()],
      idTurno: [0, Validators.required],
      fechaCierre: [new Date(), Validators.required],
      observacion: [''],
      impBase: [{ value: 0, disabled: true }],
      impTotal: [{ value: 0, disabled: true }],
      descuadre: [false],
      impDescuadre: [{ value: 0, disabled: true }],
      logs: this.fb.array([]),
      detalles: this.fb.array([])
    });

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      // Visualizar un cierre ya realizado (solo lectura, no hay flujo de edicion).
      this.isReadOnly = true;
      this.cargarCierre(Number(idParam));
    } else {
      // Nuevo cierre: siempre es del turno PENDIENTE DEL USUARIO LOGUEADO (no se
      // elige de una lista) - mismo mecanismo que venta-directa/venta-pos ya usan
      // para resolver "mi turno activo" (AbrirturnoService.ValidacionTurno).
      this.resolverTurnoPendiente();
    }
  }

  resolverTurnoPendiente() {
    const usuario = this.loginService.getUsuarioActual();
    if (!usuario) {
      this.notificacion.showError('No se pudo identificar el usuario logueado.');
      this.router.navigate(['/cierreturno']);
      return;
    }

    this.turnoService.ValidacionTurno(usuario.usuario).subscribe({
      next: (data) => {
        if (!data.tieneturno) {
          this.notificacion.showError('No tienes un turno abierto pendiente por cerrar.');
          this.router.navigate(['/cierreturno']);
          return;
        }
        this.idTurno = data.idTurno;
        this.cargarResumen(this.idTurno);
      },
      error: () => {
        this.notificacion.showError('No se pudo validar tu turno activo.');
        this.router.navigate(['/cierreturno']);
      }
    });
  }

  get detalles(): FormArray {
    return this.formulario.get('detalles') as FormArray;
  }

  // Formato numerico local (###.###.###,00) sin depender de un LOCALE_ID global
  // de Angular (la app no tiene ninguno registrado, por defecto cae en formato
  // en-US) - usa el Intl nativo del navegador, sin tocar configuracion global.
  formatearMoneda(valor: number | null | undefined): string {
    const num = Number(valor) || 0;
    return num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Trae el agrupado de td_abrirturno para el turno (solo lectura, no persiste
  // nada) y arma la grilla editable: importeSistema viene fijo del sistema,
  // valorUsuario arranca igual a importeSistema (sin diferencia) hasta que la
  // persona que cierra lo ajuste segun lo contado realmente.
  cargarResumen(idTurno: number) {
    this.cierreService.resumen(idTurno).subscribe({
      next: (data) => {
        this.nomCaja = data.nomCaja;
        this.formulario.patchValue({
          idTurno: data.idTurno,
          impBase: data.impBase
        });

        const detallesArray = this.detalles;
        detallesArray.clear();
        (data.lineas || []).forEach((linea: ResumenCierreLinea) => {
          detallesArray.push(this.crearFilaResumen(linea));
        });
        this.dataSource.data = detallesArray.controls as FormGroup[];
        this.recalcularTotales();
      },
      error: (err) => {
        this.notificacion.showError(err.error?.detail || 'No se pudo cargar el resumen del turno.');
        this.router.navigate(['/cierreturno']);
      }
    });
  }

  crearFilaResumen(linea: ResumenCierreLinea): FormGroup {
    const fila = this.fb.group({
      concepto: [linea.concepto],
      idMediopago: [linea.idMediopago],
      nombreMediopago: [linea.nombreMediopago],
      signo: [linea.signo],
      importeSistema: [{ value: linea.importeSistema, disabled: true }],
      valorUsuario: [linea.importeSistema, [Validators.required]],
      diferencia: [{ value: 0, disabled: true }]
    });

    fila.get('valorUsuario')?.valueChanges.subscribe(() => this.recalcularTotales());
    return fila;
  }

  // impTotal/impDescuadre/descuadre de la cabecera se recalculan en vivo a
  // partir de lo que el usuario va ingresando en cada fila - no se vuelven a
  // consultar al backend, ya se tiene todo lo necesario en el formulario.
  recalcularTotales() {
    let impTotal = 0;
    let impDescuadre = 0;

    this.detalles.controls.forEach((fila) => {
      const sistema = Number(fila.get('importeSistema')?.value) || 0;
      const usuario = Number(fila.get('valorUsuario')?.value) || 0;
      const diferencia = usuario - sistema;

      fila.get('diferencia')?.setValue(diferencia, { emitEvent: false });
      impTotal += sistema;
      impDescuadre += diferencia;
    });

    this.formulario.patchValue({
      impTotal,
      impDescuadre,
      descuadre: impDescuadre !== 0
    }, { emitEvent: false });
  }

  // Muestra/oculta el detalle de facturas de una fila de concepto (nivel 2).
  // Solo un concepto activo a la vez - clic de nuevo sobre el mismo lo cierra.
  toggleDetalleConcepto(index: number) {
    if (this.conceptoSeleccionado === index) {
      this.conceptoSeleccionado = null;
      this.lineasDetalle = [];
      return;
    }

    const fila = this.detalles.at(index);
    const idTurno = this.formulario.get('idTurno')?.value;
    this.conceptoSeleccionado = index;
    this.cargandoDetalle = true;
    this.lineasDetalle = [];

    this.cierreService.detalleConcepto(
      idTurno,
      fila.get('concepto')?.value,
      fila.get('idMediopago')?.value,
      fila.get('signo')?.value
    ).subscribe({
      next: (data) => {
        this.lineasDetalle = data;
        this.cargandoDetalle = false;
      },
      error: () => {
        this.notificacion.showError('No se pudo cargar el detalle de este concepto.');
        this.cargandoDetalle = false;
      }
    });
  }

  cargarCierre(id: number) {
    this.cierreService.getCierreById(id).subscribe({
      next: (data: any) => {
        this.titulo_form = 'DETALLE CIERRE DE TURNO';
        this.nomCaja = data.turno?.caja?.nomCaja || '';
        this.usuarioTurno = data.turno?.usuario || '';

        this.formulario.patchValue({
          idTrans: data.idTrans,
          idEmp: data.idEmp,
          idTurno: data.idTurno,
          fechaCierre: data.fechaCierre,
          observacion: data.observacion,
          impBase: data.impBase,
          impTotal: data.impTotal,
          descuadre: data.descuadre,
          impDescuadre: data.impDescuadre
        });

        const detallesArray = this.detalles;
        detallesArray.clear();
        (data.detalles || []).forEach((det: any) => {
          detallesArray.push(this.fb.group({
            concepto: [det.concepto],
            idMediopago: [det.idMediopago],
            nombreMediopago: [det.mediopago?.tipo || ''],
            signo: [det.signo],
            importeSistema: [{ value: det.importeSistema, disabled: true }],
            valorUsuario: [{ value: det.valorUsuario, disabled: true }],
            diferencia: [{ value: det.diferencia, disabled: true }]
          }));
        });
        this.dataSource.data = detallesArray.controls as FormGroup[];
        this.formulario.disable();
      },
      error: () => {
        this.notificacion.showError('No se pudo cargar el cierre de turno.');
        this.router.navigate(['/cierreturno']);
      }
    });
  }

  enviarFormulario() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const log = this.logAuditoria.generarLog('Nuevo');
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.push(this.fb.group({
      operacion: [log.operacion],
      usuario_mod: [log.usuario_mod],
      fecha_mod: [log.fecha_mod]
    }));

    const dataCompleta = this.formulario.getRawValue();

    const jsonParaAPI = {
      ...dataCompleta,
      fechaMod: new Date().toISOString(),
      detalles: dataCompleta.detalles.map((linea: any) => ({
        concepto: linea.concepto,
        idMediopago: linea.idMediopago,
        signo: linea.signo,
        importeSistema: linea.importeSistema,
        valorUsuario: linea.valorUsuario,
        diferencia: linea.diferencia
      }))
    };

    this.cierreService.save(jsonParaAPI).subscribe({
      next: () => {
        this.notificacion.showSuccess('Turno cerrado exitosamente.');
        this.router.navigate(['/cierreturno']);
      },
      error: (err) => {
        this.notificacion.showError(err.error?.message || 'No se pudo cerrar el turno.');
      }
    });
  }
}
