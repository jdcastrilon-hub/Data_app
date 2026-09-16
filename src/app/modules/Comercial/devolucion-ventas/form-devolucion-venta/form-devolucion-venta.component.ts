import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableDataSource } from '@angular/material/table';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { LoginService } from 'src/app/core/services/core/login.service';
import { AuditoriaDialogComponent } from 'src/app/modules/resources/auditoria-dialog/auditoria-dialog.component';
import { ComboClienteComponent } from 'src/app/modules/resources/combo-cliente/combo-cliente.component';
import { ComboVentaOrigenComponent } from '../../resources/combo-venta-origen/combo-venta-origen.component';
import { ClienteSearch } from 'src/app/core/interfaces/Comercial/ClienteSearch';
import { FacturaOrigenBusqueda } from 'src/app/core/interfaces/Comercial/FacturaOrigenBusqueda';
import { MotivoDevolucionVentaCombo } from 'src/app/core/interfaces/Comercial/MotivoDevolucionVentaCombo';
import { Documentos_Combo } from 'src/app/core/interfaces/Comercial/Documentos_Combo';
import { NotaFactura } from 'src/app/core/models/Comercial/NotaFactura';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { DevolucionVentasService } from 'src/app/core/services/Ventas/devolucion-ventas.service';
import { MotivosDevolucionVentaService } from 'src/app/core/services/Ventas/motivos-devolucionventa.service';
import { VentaServiceService } from 'src/app/core/services/Ventas/venta-service.service';
import { DocumentosVentaService } from 'src/app/core/services/Ventas/documentos-venta.service';
import { NumeradorService } from 'src/app/core/services/core/numerador.service';
import { ModalSeleccionarArticulosComponent, LineaSeleccionada } from '../modal-seleccionar-articulos/modal-seleccionar-articulos.component';

// Clase del documento (m_documventas.clase_docum) que agrupa los tipos de
// documento validos para nota credito - mismo criterio que 'Factura' en
// venta-directa/POS (ver repository_sucursal.get_sucursales_by_bodegas).
const CLASE_DOCUMENTO_NOTACREDITO = 'NotaCredito';

@Component({
  selector: 'form-devolucion-venta',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatDialogModule, MatDatepickerModule, ComboClienteComponent, ComboVentaOrigenComponent],
  templateUrl: './form-devolucion-venta.component.html',
  styleUrl: './form-devolucion-venta.component.scss'
})
export class FormDevolucionVentaComponent {

  formulario!: FormGroup;
  objeto!: NotaFactura;
  titulo_form: string = 'REGISTRO NOTA CREDITO';
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  dataSource = new MatTableDataSource<FormGroup>();
  displayedColumns: string[] = ['articulo', 'lote', 'vendida', 'cantidad', 'precioUnit', 'impTotal', 'actions'];

  // Factura origen: el autocompletar busca por cliente, esta es la referencia
  // que el template le pasa como [idCliente] para acotar la busqueda.
  idClienteSeleccionado: number | null = null;

  list_motivos: MotivoDevolucionVentaCombo[] = [];
  SelectMotivoControl = new FormControl<MotivoDevolucionVentaCombo | null>(null, Validators.required);

  // Documento propio de la nota (distinto del documento de la factura origen):
  // se carga recien cuando se conoce la sucursal (la trae la factura origen
  // elegida, ver onFacturaOrigenChange), filtrado a clase='NotaCredito'.
  list_documentos: Documentos_Combo[] = [];
  SelectdocumentoControl = new FormControl<Documentos_Combo | null>(null, Validators.required);

  @ViewChild('formDirective') formDirective!: NgForm;
  @ViewChild(ComboVentaOrigenComponent) comboVentaOrigenRef!: ComboVentaOrigenComponent;

  constructor(
    private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private devolucionService: DevolucionVentasService,
    private motivoService: MotivosDevolucionVentaService,
    private ventaService: VentaServiceService,
    private documentosService: DocumentosVentaService,
    private numeradorService: NumeradorService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.objeto = new NotaFactura();
  }

  volver(): void {
    this.router.navigate(['/devolucionventas']);
  }

  ngOnInit(): void {
    let cliente_filtro: ClienteSearch = { idCliente: 0, idPersona: 0, codTit: '', nombreCompleto: '' };

    this.formulario = this.fb.group({
      idTrans: [this.objeto.idTrans],
      idEmp: [this.objeto.idEmp],
      idSucursal: [this.objeto.idSucursal],
      idCliente: [this.objeto.idCliente, Validators.required],
      idTransRef: [this.objeto.idTransRef, Validators.required],
      idBodega: [this.objeto.idBodega],
      idEstado: [this.objeto.idEstado],
      // Reembolso en efectivo (turno/caja) es una fase aparte, todavia no
      // conectada - por ahora la nota siempre queda como saldo a favor.
      idTurno: [null],
      idCaja: [null],
      fecDoc: [new Date(), Validators.required],
      documento: [this.objeto.documento, Validators.required],
      // nroDocum ya no se maneja localmente: el backend lo asigna (numerador real
      // del documento elegido, en md_numeradores) al grabar - igual que venta-directa.
      nroDocum: [this.objeto.nroDocum],
      serie: [this.objeto.serie],
      secuencia: [this.objeto.secuencia],
      factura: [this.objeto.factura],
      idMotivo: [this.objeto.idMotivo, Validators.required],
      observacion: [this.objeto.observacion],
      impNeto: [0],
      impuesto1: ['IVA'],
      valorImpuesto1: [0],
      impuesto2: ['N/A'],
      valorImpuesto2: [0],
      impuesto3: ['N/A'],
      valorImpuesto3: [0],
      impTotal: [0],
      vista: [this.objeto.vista],
      status: [this.objeto.status],
      fechaMod: [this.objeto.fechaMod],
      detalles: this.fb.array([], Validators.required),
      logs: this.fb.array([]),
      searchCliente: [cliente_filtro],
      searchFacturaOrigen: [null]
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.disable();
      this.SelectMotivoControl.disable();
      this.SelectdocumentoControl.disable();
    }

    this.cargarMotivos();

    // Al elegir el documento propio de la nota (clase='NotaCredito'), se arma
    // serie/secuencia y se previsualiza el numero tentativo - igual que
    // venta-directa (SelectdocumentoControl.valueChanges).
    this.SelectdocumentoControl.valueChanges.subscribe(objDocumento => {
      if (objDocumento) {
        this.formulario.patchValue({
          documento: objDocumento.documento,
          serie: objDocumento.serie,
          secuencia: objDocumento.secuencia
        });

        if (!this.isEditMode) {
          this.previsualizarNumerador(objDocumento.secuencia);
        }
      }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE NOTA CREDITO' : 'ACTUALIZACION NOTA CREDITO';
        this.ModoEdicion(Number(id));
      } else {
        this.isEditMode = false;
        this.objeto = new NotaFactura();
        this.formulario.patchValue({ vista: 'NotaCredito' });
      }
    });
  }

  /**
   * Documentos propios de la nota (clase='NotaCredito') para la sucursal de la
   * factura origen elegida. Se carga recien ahi porque, a diferencia de
   * venta-directa, esta pantalla no tiene un selector de sucursal propio: la
   * sucursal la determina la factura que se va a devolver.
   */
  cargarDocumentos(idSucursal: number): void {
    this.documentosService.listCombo(idSucursal, CLASE_DOCUMENTO_NOTACREDITO).subscribe({
      next: (data) => {
        this.list_documentos = data;

        if (this.isEditMode && this.objeto.documento) {
          const documentoExistente = this.list_documentos.find(d => d.documento === this.objeto.documento);
          if (documentoExistente) {
            this.SelectdocumentoControl.setValue(documentoExistente);
          }
        } else if (!this.isEditMode) {
          const primerDocum = this.list_documentos[0];
          if (primerDocum) {
            this.SelectdocumentoControl.setValue(primerDocum);
          }
        }
      },
      error: (err) => console.error('Error cargando documentos de nota credito', err)
    });
  }

  /**
   * Muestra el numero de nota tentativo (sin consumir el numerador real). El
   * campo visible en la plantilla es "factura" (serie + numero); el numero
   * definitivo se asigna recien al grabar (backend, md_numeradores).
   */
  previsualizarNumerador(secuencia: string): void {
    const idEmp = this.loginService.getIdEmpresaActual();
    if (!idEmp || !secuencia) {
      return;
    }
    this.numeradorService.preview(idEmp, secuencia).subscribe({
      next: (data) => {
        const serie = this.formulario.get('serie')?.value || '';
        const fact = `${serie}${data.next_value ?? ''}`;

        this.formulario.get('nroDocum')?.patchValue(data.next_value);
        this.formulario.get('factura')?.patchValue(fact);
      },
      error: (err) => console.error('Error (previsualizarNumerador)', err)
    });
  }

  get detalles(): FormArray {
    return this.formulario.get('detalles') as FormArray;
  }

  cargarMotivos(): void {
    this.motivoService.listSelection().subscribe({
      next: (data) => {
        this.list_motivos = data;
        if (this.isEditMode && this.objeto.idMotivo) {
          const seleccionado = this.list_motivos.find(m => m.idMotivo === this.objeto.idMotivo);
          if (seleccionado) {
            this.SelectMotivoControl.setValue(seleccionado);
          }
        }
      },
      error: (err) => console.error('Error cargando motivos de devolucion', err)
    });
  }

  onClienteChange(cliente: ClienteSearch): void {
    if (cliente != null) {
      this.formulario.patchValue({
        idCliente: cliente.idCliente,
        searchCliente: cliente
      });
      this.formulario.get('searchCliente')?.disable();
      this.idClienteSeleccionado = cliente.idCliente!;
    } else {
      this.formulario.get('searchCliente')?.enable();
      this.formulario.patchValue({ idCliente: 0, searchCliente: null });
      this.idClienteSeleccionado = null;
      this.limpiarFacturaOrigen();
    }
  }

  limpiarFacturaOrigen(): void {
    this.comboVentaOrigenRef?.resetCampo();
    this.formulario.get('searchFacturaOrigen')?.enable();
    this.formulario.patchValue({ idTransRef: 0, idSucursal: 0, idBodega: 0, idEstado: 0, searchFacturaOrigen: null });
    this.list_documentos = [];
    this.SelectdocumentoControl.reset();
    this.detalles.clear();
    this.dataSource.data = [];
  }

  // Trae bodega/estado/sucursal de la factura origen (quedan fijas: la
  // devolucion tiene que volver exactamente a donde salio).
  onFacturaOrigenChange(factura: FacturaOrigenBusqueda | null): void {
    if (!factura) {
      this.limpiarFacturaOrigen();
      return;
    }

    this.formulario.patchValue({ idTransRef: factura.idTrans, searchFacturaOrigen: factura });
    this.formulario.get('searchFacturaOrigen')?.disable();

    this.ventaService.getVentaById(factura.idTrans).subscribe({
      next: (data) => {
        this.formulario.patchValue({
          idSucursal: data.idSucursalEmp,
          idBodega: data.idBodega,
          idEstado: data.idEstado
        });
        // El documento de la nota (clase='NotaCredito') es propio de esta
        // sucursal - recien se conoce ahora, con la factura origen ya elegida.
        this.cargarDocumentos(data.idSucursalEmp);
      },
      error: (err) => console.error('Error cargando la factura origen', err)
    });

    this.detalles.clear();
    this.dataSource.data = [];
  }

  abrirSeleccionArticulos(): void {
    const idTransRef = this.formulario.get('idTransRef')?.value;
    if (!idTransRef) {
      this.notificacion.showError('Primero selecciona la factura origen.');
      return;
    }

    const lineasActuales: LineaSeleccionada[] = this.detalles.controls.map(f => f.getRawValue());

    const dialogRef = this.dialog.open(ModalSeleccionarArticulosComponent, {
      width: '900px',
      data: {
        idTransRef,
        lineasYaAgregadas: lineasActuales,
        excluirIdTrans: this.isEditMode ? this.objeto.idTrans : undefined
      }
    });

    dialogRef.afterClosed().subscribe((resultado: LineaSeleccionada[] | null) => {
      if (!resultado) {
        return;
      }
      this.detalles.clear();
      resultado.forEach(linea => {
        this.detalles.push(this.fb.group({
          idArticulo: [linea.idArticulo],
          idCodBarra: [linea.idCodBarra],
          idLote: [linea.idLote],
          codLote: [linea.codLote],
          codArticulo: [linea.codArticulo],
          nomArticulo: [linea.nomArticulo],
          cantidadVendida: [linea.cantidadVendida],
          cantidad: [linea.cantidad, [Validators.required, Validators.min(1)]],
          precioUnit: [linea.precioUnit],
          impuesto1: [linea.impuesto1],
          idTasaimp1: [linea.idTasaimp1],
          valorImpuesto1: [linea.valorImpuesto1],
          impuesto2: [linea.impuesto2],
          idTasaimp2: [0],
          valorImpuesto2: [linea.valorImpuesto2],
          impuesto3: [linea.impuesto3],
          idTasaimp3: [0],
          valorImpuesto3: [linea.valorImpuesto3],
          impNeto: [linea.impNeto],
          impTotal: [linea.impTotal]
        }));
      });
      this.dataSource.data = this.detalles.controls as FormGroup[];
    });
  }

  eliminarLinea(index: number): void {
    this.detalles.removeAt(index);
    this.dataSource.data = this.detalles.controls as FormGroup[];
  }

  get totalNeto(): number {
    return this.detalles.getRawValue().reduce((acc: number, fila: any) => acc + (Number(fila.impNeto) || 0), 0);
  }

  get totalImpuesto1(): number {
    return this.detalles.getRawValue().reduce((acc: number, fila: any) => acc + (Number(fila.valorImpuesto1) || 0), 0);
  }

  get totalNota(): number {
    return this.detalles.getRawValue().reduce((acc: number, fila: any) => acc + (Number(fila.impTotal) || 0), 0);
  }

  ModoEdicion(id: number): void {
    this.devolucionService.getNotaById(id).subscribe({
      next: (data: any) => {
        this.objeto = data;

        this.titulo_form = this.isReadOnly ? 'DETALLE NOTA CREDITO' : 'ACTUALIZACION NOTA CREDITO';

        this.formulario.patchValue({
          idTrans: data.idTrans,
          idEmp: data.idEmp,
          idSucursal: data.idSucursal,
          idCliente: data.idCliente,
          idTransRef: data.idTransRef,
          idBodega: data.idBodega,
          idEstado: data.idEstado,
          idTurno: data.idTurno,
          idCaja: data.idCaja,
          fecDoc: data.fecDoc,
          documento: data.documento,
          nroDocum: data.nroDocum,
          serie: data.serie,
          idMotivo: data.idMotivo,
          observacion: data.observacion,
          impNeto: data.impNeto,
          valorImpuesto1: data.valorImpuesto1,
          impTotal: data.impTotal,
          vista: data.vista,
          status: data.status
        });

        // "factura" (el campo visible) solo se calcula normalmente via
        // previsualizarNumerador(), que se salta en modo edicion (esta nota ya
        // tiene numero real asignado) - se arma aca directo con serie+nroDocum.
        this.formulario.get('factura')?.patchValue(`${data.serie ?? ''}${data.nroDocum ?? ''}`);
        // Documento propio de la nota, para preseleccionarlo en el combo.
        this.cargarDocumentos(data.idSucursal);

        const cliente: ClienteSearch = {
          idCliente: data.idCliente,
          idPersona: 0,
          codTit: data.cliente?.codTit,
          nombreCompleto: data.cliente?.nombreCompleto
        };
        this.formulario.patchValue({ searchCliente: cliente });
        this.formulario.get('searchCliente')?.disable();
        this.idClienteSeleccionado = data.idCliente;

        const facturaOrigen: FacturaOrigenBusqueda = {
          idTrans: data.factura_origen?.idTrans ?? data.idTransRef,
          nroDocum: data.factura_origen?.nroDocum,
          serie: data.factura_origen?.serie,
          fecDoc: data.factura_origen?.fecDoc,
          impTotal: data.factura_origen?.impTotal
        };
        this.formulario.patchValue({ searchFacturaOrigen: facturaOrigen });
        this.formulario.get('searchFacturaOrigen')?.disable();

        this.cargarMotivos();

        const logsFormArray = this.formulario.get('logs') as FormArray;
        logsFormArray.clear();
        (data.logs ?? []).forEach((log: Auditoria) => {
          logsFormArray.push(this.fb.group({
            operacion: [log.operacion],
            usuario_mod: [log.usuario_mod],
            fecha_mod: [log.fecha_mod]
          }));
        });

        this.detalles.clear();
        (data.detalles ?? []).forEach((det: any) => {
          this.detalles.push(this.fb.group({
            idArticulo: [det.idArticulo],
            idCodBarra: [det.idCodBarra],
            idLote: [det.idLote],
            codLote: [det.codLote ?? ''],
            codArticulo: [det.articulo?.codArticulo ?? ''],
            nomArticulo: [det.articulo?.nomArticulo ?? ''],
            cantidadVendida: [det.cantidadVendida ?? 0],
            cantidad: [det.cantidad, [Validators.required, Validators.min(1)]],
            precioUnit: [det.precioUnit],
            impuesto1: [det.impuesto1],
            idTasaimp1: [det.idTasaimp1],
            valorImpuesto1: [det.valorImpuesto1],
            impuesto2: [det.impuesto2],
            idTasaimp2: [det.idTasaimp2],
            valorImpuesto2: [det.valorImpuesto2],
            impuesto3: [det.impuesto3],
            idTasaimp3: [det.idTasaimp3],
            valorImpuesto3: [det.valorImpuesto3],
            impNeto: [det.impNeto],
            impTotal: [det.impTotal]
          }));
        });
        this.dataSource.data = this.detalles.controls as FormGroup[];

        if (this.isReadOnly) {
          this.detalles.disable();
        }
      },
      error: (err) => {
        console.error('Error al cargar la nota crédito:', err);
        this.router.navigate(['/devolucionventas']);
      }
    });
  }

  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - Nota Crédito ${this.objeto.nroDocum ?? ''}`,
        logs: this.formulario.get('logs')?.value
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }

  agregarLogAuditoria(): void {
    const logData = this.logAuditoria.generarLog(!this.isEditMode ? 'Nuevo' : 'Edicion');
    const auditoriaGroup = this.fb.group({
      operacion: [logData.operacion],
      usuario_mod: [logData.usuario_mod],
      fecha_mod: [logData.fecha_mod]
    });
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.push(auditoriaGroup);
  }

  enviarFormulario(): void {
    if (this.detalles.length === 0) {
      this.notificacion.showError('Debes seleccionar al menos un artículo a devolver.');
      return;
    }

    this.formulario.patchValue({
      idEmp: this.loginService.getIdEmpresaActual(),
      idMotivo: this.SelectMotivoControl.value?.idMotivo,
      impNeto: this.totalNeto,
      valorImpuesto1: this.totalImpuesto1,
      impTotal: this.totalNota,
      fechaMod: new Date().toISOString()
    });

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.agregarLogAuditoria();

    const dataCompleta = this.formulario.getRawValue();
    const jsonParaAPI = {
      ...dataCompleta,
      searchCliente: undefined,
      searchFacturaOrigen: undefined
    };
    console.log("json final")
    console.log(jsonParaAPI)

    if (this.isEditMode) {
      this.devolucionService.edit(this.objeto.idTrans!, jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Nota crédito editada con éxito!');
          this.router.navigate(['/devolucionventas']);
        },
        error: (err) => {
          console.error('Error al editar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar la nota crédito.');
        }
      });
    } else {
      this.devolucionService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Nota crédito guardada con éxito!');
          this.router.navigate(['/devolucionventas']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar la nota crédito.');
        }
      });
    }
  }

}
