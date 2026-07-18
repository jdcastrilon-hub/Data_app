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
import { ComboProveedorComponent } from '../../../resources/combo-proveedor/combo-proveedor.component';
import { ComboCompraOrigenComponent } from '../../resources/combo-compra-origen/combo-compra-origen.component';
import { ProveedorSearch } from '../../../../core/interfaces/Compras/ProveedorSearch';
import { CompraOrigenBusqueda } from 'src/app/core/interfaces/Compras/CompraOrigenBusqueda';
import { MotivoDevolucionCombo } from 'src/app/core/interfaces/Compras/MotivoDevolucionCombo';
import { Devolucion } from 'src/app/core/models/Compras/Devolucion';
import { Auditoria } from 'src/app/core/models/core/Auditoria';
import { DevolucionComprasService } from 'src/app/core/services/Compras/devolucion-compras.service';
import { MotivosDevolucionService } from 'src/app/core/services/Compras/motivos-devolucion.service';
import { ComprasService } from 'src/app/core/services/Compras/compras.service';
import { ModalSeleccionarArticulosComponent, LineaSeleccionada } from '../modal-seleccionar-articulos/modal-seleccionar-articulos.component';

@Component({
  selector: 'form-devolucion',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    RouterModule, MatDialogModule, MatDatepickerModule, ComboProveedorComponent, ComboCompraOrigenComponent],
  templateUrl: './form-devolucion.component.html',
  styleUrl: './form-devolucion.component.scss'
})
export class FormDevolucionComponent {

  //Variables generales
  formulario!: FormGroup;
  objeto!: Devolucion;
  titulo_form: string = 'REGISTRO DEVOLUCION A PROVEEDOR';
  isEditMode: boolean = false;
  isReadOnly: boolean = false;

  //tabla de articulos
  dataSource = new MatTableDataSource<FormGroup>();
  displayedColumns: string[] = ['articulo', 'lote', 'comprada', 'cantidad', 'costoUnit', 'costoTotal', 'actions'];

  //Compra origen: el autocompletar busca por proveedor, esta es la referencia
  //que el template le pasa como [idProveedor] para acotar la busqueda.
  idProveedorSeleccionado: number | null = null;

  //Motivos de devolucion
  list_motivos: MotivoDevolucionCombo[] = [];
  SelectMotivoControl = new FormControl<MotivoDevolucionCombo | null>(null, Validators.required);

  @ViewChild('formDirective') formDirective!: NgForm;
  @ViewChild(ComboCompraOrigenComponent) comboCompraOrigenRef!: ComboCompraOrigenComponent;

  constructor(
    private fb: FormBuilder,
    private logAuditoria: AuditoriaService,
    private devolucionService: DevolucionComprasService,
    private motivoService: MotivosDevolucionService,
    private compraService: ComprasService,
    private notificacion: NotificacionesService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.objeto = new Devolucion();
  }

  volver(): void {
    this.router.navigate(['/devolucioncompras']);
  }

  ngOnInit(): void {
    let proveedor_filtro: ProveedorSearch = { idProveedor: 0, idPersona: 0, codTit: '', nombreCompleto: '' };

    this.formulario = this.fb.group({
      idTrans: [this.objeto.idTrans],
      idEmp: [this.objeto.idEmp],
      idSucursal: [this.objeto.idSucursal],
      idProveedor: [this.objeto.idProveedor, Validators.required],
      idCompraOrigen: [this.objeto.idCompraOrigen, Validators.required],
      idBodega: [this.objeto.idBodega],
      idEstado: [this.objeto.idEstado],
      fecDoc: [new Date(), Validators.required],
      documento: [this.objeto.documento],
      nroDocum: [this.objeto.nroDocum],
      idMotivo: [this.objeto.idMotivo, Validators.required],
      observacion: [this.objeto.observacion, Validators.required],
      status: [this.objeto.status],
      impTotal: [0],
      vista: [this.objeto.vista],
      fechaMod: [this.objeto.fechaMod],
      detalles: this.fb.array([], Validators.required),
      logs: this.fb.array([]),
      searchProveedor: [proveedor_filtro],
      searchCompraOrigen: [null]
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.disable();
      this.SelectMotivoControl.disable();
    }

    this.cargarMotivos();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.titulo_form = this.isReadOnly ? 'DETALLE DEVOLUCION A PROVEEDOR' : 'ACTUALIZACION DEVOLUCION A PROVEEDOR';
        this.ModoEdicion(Number(id));
      } else {
        this.isEditMode = false;
        this.objeto = new Devolucion();
        this.formulario.patchValue({
          documento: 'devolucion',
          vista: 'DevolucionCompra'
        });
      }
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

  // Se dispara al elegir/limpiar el proveedor en el buscador
  onProveedorChange(proveedor: ProveedorSearch): void {
    if (proveedor != null) {
      this.formulario.patchValue({
        idProveedor: proveedor.idProveedor,
        searchProveedor: proveedor
      });
      this.formulario.get('searchProveedor')?.disable();
      this.idProveedorSeleccionado = proveedor.idProveedor!;
    } else {
      this.formulario.get('searchProveedor')?.enable();
      this.formulario.patchValue({ idProveedor: 0, searchProveedor: null });
      this.idProveedorSeleccionado = null;
      this.limpiarCompraOrigen();
    }
  }

  // Limpia la compra origen seleccionada (al cambiar de proveedor o al quitarla
  // directamente desde el autocompletar) y todo lo que dependia de ella.
  limpiarCompraOrigen(): void {
    this.comboCompraOrigenRef?.resetCampo();
    this.formulario.get('searchCompraOrigen')?.enable();
    this.formulario.patchValue({ idCompraOrigen: 0, idBodega: 0, idEstado: 0, searchCompraOrigen: null });
    this.detalles.clear();
    this.dataSource.data = [];
  }

  // Se dispara al elegir/limpiar la compra origen en el buscador: trae
  // bodega/estado/sucursal de esa compra (quedan fijas, la devolucion tiene que
  // volver exactamente a donde llego).
  onCompraOrigenChange(compra: CompraOrigenBusqueda | null): void {
    if (!compra) {
      this.limpiarCompraOrigen();
      return;
    }

    this.formulario.patchValue({ idCompraOrigen: compra.idTrans, searchCompraOrigen: compra });
    this.formulario.get('searchCompraOrigen')?.disable();

    this.compraService.getCompraById(compra.idTrans).subscribe({
      next: (data) => {
        this.formulario.patchValue({
          idSucursal: data.bodega?.idSucursal,
          idBodega: data.idBodega,
          idEstado: data.idEstado
        });
      },
      error: (err) => console.error('Error cargando la compra origen', err)
    });

    // Si cambio de compra origen, la seleccion de articulos anterior ya no aplica.
    this.detalles.clear();
    this.dataSource.data = [];
  }

  abrirSeleccionArticulos(): void {
    const idCompraOrigen = this.formulario.get('idCompraOrigen')?.value;
    if (!idCompraOrigen) {
      this.notificacion.showError('Primero selecciona la compra origen.');
      return;
    }

    const lineasActuales: LineaSeleccionada[] = this.detalles.controls.map(f => f.getRawValue());

    const dialogRef = this.dialog.open(ModalSeleccionarArticulosComponent, {
      width: '900px',
      data: {
        idCompraOrigen,
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
          cantidadComprada: [linea.cantidadComprada],
          cantidad: [linea.cantidad, [Validators.required, Validators.min(1)]],
          costoUnit: [linea.costoUnit],
          costoTotal: [linea.costoTotal]
        }));
      });
      this.dataSource.data = this.detalles.controls as FormGroup[];
    });
  }

  eliminarLinea(index: number): void {
    this.detalles.removeAt(index);
    this.dataSource.data = this.detalles.controls as FormGroup[];
  }

  get totalDevolucion(): number {
    return this.detalles.getRawValue().reduce((acc: number, fila: any) => acc + (Number(fila.costoTotal) || 0), 0);
  }

  ModoEdicion(id: number): void {
    this.devolucionService.getDevolucionById(id).subscribe({
      next: (data: any) => {
        this.objeto = data;

        this.titulo_form = this.isReadOnly ? 'DETALLE DEVOLUCION A PROVEEDOR' : 'ACTUALIZACION DEVOLUCION A PROVEEDOR';

        this.formulario.patchValue({
          idTrans: data.idTrans,
          idEmp: data.idEmp,
          idSucursal: data.idSucursal,
          idProveedor: data.idProveedor,
          idCompraOrigen: data.idCompraOrigen,
          idBodega: data.idBodega,
          idEstado: data.idEstado,
          fecDoc: data.fecDoc,
          documento: data.documento,
          nroDocum: data.nroDocum,
          idMotivo: data.idMotivo,
          observacion: data.observacion,
          status: data.status,
          impTotal: data.impTotal,
          vista: data.vista
        });

        const proveedor: ProveedorSearch = {
          idProveedor: data.idProveedor,
          idPersona: 0,
          codTit: data.proveedor?.codTit,
          nombreCompleto: data.proveedor?.nombreCompleto
        };
        this.formulario.patchValue({ searchProveedor: proveedor });
        this.formulario.get('searchProveedor')?.disable();
        this.idProveedorSeleccionado = data.idProveedor;

        const compraOrigen: CompraOrigenBusqueda = {
          idTrans: data.compra_origen?.idTrans ?? data.idCompraOrigen,
          nroDocum: data.compra_origen?.nroDocum,
          remito: data.compra_origen?.remito,
          fecDoc: data.compra_origen?.fecDoc,
          impTotal: data.compra_origen?.impTotal
        };
        this.formulario.patchValue({ searchCompraOrigen: compraOrigen });
        this.formulario.get('searchCompraOrigen')?.disable();

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
            cantidadComprada: [det.cantidadComprada ?? 0],
            cantidad: [det.cantidad, [Validators.required, Validators.min(1)]],
            costoUnit: [det.costoUnit],
            costoTotal: [det.costoTotal]
          }));
        });
        this.dataSource.data = this.detalles.controls as FormGroup[];

        if (this.isReadOnly) {
          this.detalles.disable();
        }
      },
      error: (err) => {
        console.error('Error al cargar la devolución:', err);
        this.router.navigate(['/devolucioncompras']);
      }
    });
  }

  verHistorialAuditoria(): void {
    const dialogRef = this.dialog.open(AuditoriaDialogComponent, {
      width: '500px',
      data: {
        titulo: `Historial de Auditoría - Devolución ${this.objeto.nroDocum ?? ''}`,
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
      impTotal: this.totalDevolucion,
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
      searchProveedor: undefined,
      searchCompraOrigen: undefined
    };

    if (this.isEditMode) {
      this.devolucionService.edit(this.objeto.idTrans!, jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Devolución editada con éxito!');
          this.router.navigate(['/devolucioncompras']);
        },
        error: (err) => {
          console.error('Error al editar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo editar la devolución.');
        }
      });
    } else {
      this.devolucionService.save(jsonParaAPI).subscribe({
        next: () => {
          this.notificacion.showSuccess('¡Devolución guardada con éxito!');
          this.router.navigate(['/devolucioncompras']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.notificacion.showError(err.error?.message || 'No se pudo guardar la devolución.');
        }
      });
    }
  }

}
