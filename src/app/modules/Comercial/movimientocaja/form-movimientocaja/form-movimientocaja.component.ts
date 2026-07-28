import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { MovimientoCajaService } from 'src/app/core/services/Ventas/movimientocaja.service';
import { ConceptosService } from 'src/app/core/services/Tesoreria/conceptos.service';
import { AbrirturnoService } from 'src/app/core/services/Ventas/abrirturno.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { AuditoriaService } from 'src/app/core/services/core/auditoria.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { ModalValturnoComponent } from 'src/app/modules/resources/modal-valturno/modal-valturno.component';
import { ConceptoCajaCombo } from 'src/app/core/interfaces/Comercial/ConceptoCajaCombo';
import { MovimientoCaja } from 'src/app/core/models/Ventas/MovimientoCaja';

@Component({
  selector: 'app-form-movimientocaja',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, RouterModule, MatDialogModule, MatRadioModule],
  templateUrl: './form-movimientocaja.component.html',
  styleUrl: './form-movimientocaja.component.scss'
})
export class FormMovimientocajaComponent {

  formulario!: FormGroup;
  titulo_form: string = 'MOVIMIENTO CAJA';
  isReadOnly: boolean = false;
  // El turno se resuelve solo (es el turno pendiente del usuario logueado) -
  // nunca se muestra un selector en pantalla, solo viaja en el payload.
  idTurno: number = 0;

  @ViewChild('importeInput') importeInputRef!: ElementRef<HTMLInputElement>;

  list_conceptos: ConceptoCajaCombo[] = [];
  SelecConceptoControl = new FormControl<ConceptoCajaCombo | null>(null, Validators.required);
  // 1 = Ingreso, -1 = Gasto - filtra el combo de conceptos, no se guarda directo.
  tipoControl = new FormControl<number>(1, Validators.required);

  constructor(
    private fb: FormBuilder,
    private movService: MovimientoCajaService,
    private conceptosService: ConceptosService,
    private turnoService: AbrirturnoService,
    private notificacion: NotificacionesService,
    private logAuditoria: AuditoriaService,
    private loginService: LoginService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      id: [null],
      idConcepto: [null, Validators.required],
      idTurno: [0, Validators.required],
      fecha: [new Date(), Validators.required],
      observacion: [''],
      importe: [null, [Validators.required, Validators.min(0.01), this.validarLimiteConcepto]],
      logs: this.fb.array([])
    });

    this.SelecConceptoControl.valueChanges.subscribe(concepto => {
      this.formulario.get('idConcepto')?.setValue(concepto?.id ?? null);
      this.formulario.get('importe')?.updateValueAndValidity();
    });

    this.tipoControl.valueChanges.subscribe(signo => {
      this.SelecConceptoControl.setValue(null);
      this.cargarConceptos(signo!);
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      // No hay edicion para este modulo (registro contable) - la ruta /view
      // solo consulta, ver reglas del usuario en project_data_comercial_module.
      this.isReadOnly = true;
      this.titulo_form = 'DETALLE MOVIMIENTO CAJA';
      this.cargarMovimiento(Number(idParam));
    } else {
      this.resolverTurnoPendiente();
    }
  }

  resolverTurnoPendiente(): void {
    const usuario = this.loginService.getUsuarioActual();
    if (!usuario) {
      this.notificacion.showError('No se pudo identificar el usuario logueado.');
      this.router.navigate(['/movimientocaja']);
      return;
    }

    this.turnoService.ValidacionTurno(usuario.usuario).subscribe({
      next: (data) => {
        // Mismo modal ya usado en venta-pos para "sin turno abierto" (con boton
        // para ir directo a abrir uno) - antes esto era solo un toast de error.
        if (!data.tieneturno) {
          this.bloquearPantalla();
          return;
        }
        // Mismo bloqueo ya usado en venta-directa/venta-pos: un turno vencido
        // debe cerrarse primero, no seguir generando movimientos sobre el.
        if (data.turnoVencido) {
          this.bloquearPantallaVencido(data.horasTranscurridas, data.horasLimite);
          return;
        }

        this.idTurno = data.idTurno;
        this.formulario.get('idTurno')?.setValue(data.idTurno);
        this.cargarConceptos(this.tipoControl.value!);
      },
      error: () => {
        this.notificacion.showError('No se pudo validar tu turno activo.');
        this.router.navigate(['/movimientocaja']);
      }
    });
  }

  // Mismo patron/textos por defecto que form-ventapos.bloquearPantalla().
  bloquearPantalla(): void {
    this.dialog.open(ModalValturnoComponent, {
      width: '400px',
      disableClose: true
    });
  }

  bloquearPantallaVencido(horasTranscurridas?: number, horasLimite?: number): void {
    this.dialog.open(ModalValturnoComponent, {
      width: '420px',
      disableClose: true,
      data: {
        titulo: 'Turno Vencido',
        mensaje: `Tienes un turno abierto desde hace ${horasTranscurridas ?? '?'} horas (limite: ${horasLimite ?? '?'} horas para esta caja). Debes cerrarlo antes de continuar.`,
        textoBoton: 'Cerrar Turno Ahora',
        ruta: '/cierreturno/new'
      }
    });
  }

  cargarConceptos(signo: number): void {
    const usuario = this.loginService.getUsuarioActual();
    if (!usuario) {
      return;
    }
    this.conceptosService.porUsuario(usuario.idUsuario, signo).subscribe({
      next: (data) => {
        this.list_conceptos = data;
      },
      error: () => {
        this.notificacion.showError('No se pudieron cargar los conceptos.');
      }
    });
  }

  // Rechaza un importe mayor al limite del concepto elegido (si aplicaLimit).
  // El ">0" ya lo cubre Validators.min - este validador solo agrega la regla
  // de negocio especifica del concepto.
  validarLimiteConcepto = (control: AbstractControl): ValidationErrors | null => {
    const concepto = this.SelecConceptoControl?.value;
    if (!concepto || !concepto.aplicaLimit || concepto.impLimit == null) {
      return null;
    }
    const valor = Number(control.value) || 0;
    return valor > concepto.impLimit ? { superaLimite: { limite: concepto.impLimit } } : null;
  };

  // Formatea "Importe" con separador de miles mientras se escribe (mismo
  // patron ya usado en "Base" de form-turnos / "Total Contado" de cierre).
  onImporteInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '');
    const valorNumerico = soloDigitos ? Number(soloDigitos) : null;
    this.formulario.get('importe')?.setValue(valorNumerico);
    input.value = soloDigitos ? Number(soloDigitos).toLocaleString('es-CO') : '';
  }

  cargarMovimiento(id: number): void {
    this.movService.getMovCajaById(id).subscribe({
      next: (data: MovimientoCaja) => {
        this.idTurno = data.idTurno;
        this.formulario.patchValue({
          id: data.id,
          idConcepto: data.idConcepto,
          idTurno: data.idTurno,
          fecha: data.fecha,
          observacion: data.observacion,
          importe: data.importe
        });

        if (data.concepto) {
          this.tipoControl.setValue(data.concepto.signo, { emitEvent: false });
          this.SelecConceptoControl.setValue({
            id: data.idConcepto,
            nomConcepto: data.concepto.nomConcepto,
            signo: data.concepto.signo,
            aplicaLimit: false
          }, { emitEvent: false });
        }

        if (this.importeInputRef) {
          this.importeInputRef.nativeElement.value = data.importe ? Number(data.importe).toLocaleString('es-CO') : '';
        }

        const logsFormArray = this.formulario.get('logs') as FormArray;
        logsFormArray.clear();
        (data.logs || []).forEach((log: any) => {
          logsFormArray.push(this.fb.group({
            operacion: [log.operacion],
            usuario_mod: [log.usuario_mod],
            fecha_mod: [log.fecha_mod]
          }));
        });

        this.formulario.disable();
        this.SelecConceptoControl.disable();
        this.tipoControl.disable();
      },
      error: () => {
        this.notificacion.showError('No se pudo cargar el movimiento de caja.');
        this.router.navigate(['/movimientocaja']);
      }
    });
  }

  // "YYYY-MM-DD" en hora local, para el campo DATE de t_movcajas.
  private formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  enviarFormulario(): void {
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

    // "fecha" en t_movcajas es DATE (no datetime) - el backend rechaza un ISO
    // datetime completo (lo que produce JSON.stringify sobre un objeto Date de
    // JS). Se manda solo la parte de fecha, en hora LOCAL (no toISOString(),
    // que convierte a UTC y puede correrse un dia segun la zona horaria).
    const fecha = this.formulario.get('fecha')?.value as Date;
    const jsonParaAPI = {
      ...this.formulario.getRawValue(),
      fecha: this.formatearFecha(fecha),
      fechaMod: new Date().toISOString()
    };

    this.movService.save(jsonParaAPI).subscribe({
      next: () => {
        this.notificacion.showSuccess('Movimiento de caja registrado exitosamente.');
        this.router.navigate(['/movimientocaja']);
      },
      error: (err) => {
        this.notificacion.showError(err.error?.detail || err.error?.message || 'No se pudo registrar el movimiento.');
      }
    });
  }
}
