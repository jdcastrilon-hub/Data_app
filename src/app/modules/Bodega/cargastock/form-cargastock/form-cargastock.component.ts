import { Component } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ComboBodegaComponent } from '../../../resources/combo-bodega/combo-bodega.component';
import { ComboEstadostockComponent } from '../../../resources/combo-estadostock/combo-estadostock.component';
import { NegocioServiceService } from 'src/app/core/services/General/negocio-service.service';
import { NegocioCombo } from 'src/app/core/interfaces/Core/NegocioCombo';
import { EmpresaByNegocioCategorias } from 'src/app/core/interfaces/Core/EmpresaByNegocioCategorias';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ResultadoCargaStock } from 'src/app/core/interfaces/Bodega/CargaStockResultado';
import { CargaStock } from 'src/app/core/models/Bodega/CargaStock';
import { CargastockService } from 'src/app/core/services/Bodega/cargastock.service';

@Component({
  selector: 'form-cargastock',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    MatDatepickerModule, MatTooltipModule, MatProgressBarModule, RouterModule,
    ComboBodegaComponent, ComboEstadostockComponent],
  templateUrl: './form-cargastock.component.html',
  styleUrl: './form-cargastock.component.scss'
})
export class FormCargastockComponent {

  //Variables generales
  formulario!: FormGroup;
  objeto!: CargaStock;
  titulo_form: string = 'CARGA MASIVA DE INVENTARIO';
  isReadOnly: boolean = false;

  //Negocios
  list_negocios: NegocioCombo[] = [];
  SelectNegocioControl = new FormControl<NegocioCombo | null>(null, Validators.required);

  //Archivo Excel seleccionado (aun no se envia a ningun API)
  archivoSeleccionado: File | null = null;
  nombreArchivo: string = '';

  //Resultado de la validacion/confirmacion (por ahora, siempre datos de ejemplo)
  resultado: ResultadoCargaStock | null = null;
  procesando: boolean = false;

  //Plantilla Excel
  descargandoPlantilla: boolean = false;

  constructor(
    private fb: FormBuilder,
    private negocioService: NegocioServiceService,
    private notificacion: NotificacionesService,
    private cargastockService: CargastockService,
    private router: Router,
    private route: ActivatedRoute) {
    this.objeto = new CargaStock();
  }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      idBodega: [null, Validators.required],
      idEstado: [null, Validators.required],
      fechaMovimiento: [new Date(), Validators.required],
      observacion: ['']
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.disable();
    }

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.titulo_form = 'DETALLE CARGA MASIVA DE INVENTARIO';
        this.ModoVer(Number(id));
      } else {
        this.cargarNegocios();
      }
    });
  }

  //Carga una carga masiva ya procesada, en modo solo lectura.
  ModoVer(id: number): void {
    this.cargastockService.getCargaById(id).subscribe({
      next: (data: CargaStock) => {
        this.objeto = data;
        this.formulario.patchValue({
          idBodega: data.idBodega,
          idEstado: data.idEstado,
          fechaMovimiento: data.fechaMovimiento,
          observacion: data.observacion
        });
        this.nombreArchivo = data.nombreArchivo || '';
        this.cargarNegocios();
      },
      error: (err) => {
        console.error('Error al cargar la carga:', err);
        this.router.navigate(['/cargastock']);
      }
    });
  }

  //Metodo para cargar lista de negocios (mismo patron que form-articulo)
  cargarNegocios(): void {
    this.negocioService.listNegociosxCategoria().subscribe({
      next: (data: EmpresaByNegocioCategorias) => {
        this.list_negocios = data.listnegocio!;

        if (this.isReadOnly) {
          const negocioActual = this.list_negocios.find(n => n.idNegocio === this.objeto.idNegocio);
          if (negocioActual) {
            this.SelectNegocioControl.setValue(negocioActual);
          }
          this.SelectNegocioControl.disable();
        } else if (this.list_negocios.length === 1) {
          this.SelectNegocioControl.setValue(this.list_negocios[0]);
        }
      },
      error: (err) => {
        console.error('Error cargando negocio', err);
      }
    });
  }

  //Descarga la plantilla Excel en blanco con las columnas que espera la carga masiva.
  descargarPlantilla(): void {
    this.descargandoPlantilla = true;
    this.cargastockService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'plantilla_carga_inventario.xlsx';
        enlace.click();
        window.URL.revokeObjectURL(url);
        this.descargandoPlantilla = false;
      },
      error: (err) => {
        console.error('Error descargando la plantilla', err);
        this.notificacion.showError('No se pudo descargar la plantilla.');
        this.descargandoPlantilla = false;
      }
    });
  }

  recibirBodega(bodega: any) {
    this.formulario.patchValue({ idBodega: bodega.id });
  }

  recibirEstado(estado: any) {
    this.formulario.patchValue({ idEstado: estado.id });
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoSeleccionado = input.files[0];
      this.nombreArchivo = this.archivoSeleccionado.name;
      // Un archivo nuevo invalida cualquier vista previa anterior.
      this.resultado = null;
    }
  }

  quitarArchivo(): void {
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.resultado = null;
  }

  camposCabezalValidos(): boolean {
    return this.formulario.valid && !!this.SelectNegocioControl.value && !!this.archivoSeleccionado;
  }

  // Cabezal + archivo listos para enviar al API (confirmar=false para validar, true para grabar).
  private construirCabezal() {
    const valor = this.formulario.value;
    return {
      idBodega: valor.idBodega,
      idEstado: valor.idEstado,
      idNegocio: this.SelectNegocioControl.value!.idNegocio!,
      fechaMovimiento: this.formatearFecha(valor.fechaMovimiento),
      observacion: valor.observacion
    };
  }

  // Fecha en 'YYYY-MM-DD' usando componentes locales (evita el corrimiento de un dia
  // que produciria Date.toISOString() al convertir a UTC).
  private formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  // Valida el archivo (confirmar=false): el backend revisa todas las filas y devuelve
  // los errores + resumen, sin grabar nada todavia.
  validarArchivo(): void {
    this.formulario.markAllAsTouched();
    this.SelectNegocioControl.markAsTouched();

    if (!this.camposCabezalValidos()) {
      this.notificacion.showError('Complete el cabezal y seleccione un archivo antes de validar.');
      return;
    }

    this.procesando = true;
    this.cargastockService.procesar(this.archivoSeleccionado!, this.construirCabezal(), false).subscribe({
      next: (data) => {
        this.resultado = data;
        this.procesando = false;
      },
      error: (err) => {
        console.error('Error validando el archivo', err);
        this.notificacion.showError(err.error?.message || 'No se pudo validar el archivo.');
        this.procesando = false;
      }
    });
  }

  // Confirma y graba (confirmar=true): solo tiene sentido despues de una validacion sin errores.
  confirmarGuardado(): void {
    if (!this.resultado || this.resultado.status === 'error') {
      this.notificacion.showError('Debe validar el archivo sin errores antes de confirmar.');
      return;
    }

    this.procesando = true;
    this.cargastockService.procesar(this.archivoSeleccionado!, this.construirCabezal(), true).subscribe({
      next: (data) => {
        this.procesando = false;
        this.notificacion.showSuccess('¡Carga procesada con éxito!');
        this.prepararNuevaCarga();
      },
      error: (err) => {
        console.error('Error guardando la carga', err);
        this.notificacion.showError(err.error?.message || 'No se pudo guardar la carga.');
        this.procesando = false;
      }
    });
  }

  // Al grabar con exito: se conservan bodega/estado/negocio (lo usual es seguir cargando
  // archivos para la misma bodega), pero se limpian archivo, observacion, resultado y la
  // fecha vuelve a hoy, dejando el formulario listo para una carga nueva.
  private prepararNuevaCarga(): void {
    const idBodega = this.formulario.value.idBodega;
    const idEstado = this.formulario.value.idEstado;
    const negocioActual = this.SelectNegocioControl.value;

    this.formulario.reset({
      idBodega,
      idEstado,
      fechaMovimiento: new Date(),
      observacion: ''
    });
    this.SelectNegocioControl.setValue(negocioActual);
    this.quitarArchivo();
  }

  // Solo limpia el archivo cargado (para volver a subirlo); el cabezal se conserva.
  limpiarFormulario(): void {
    this.quitarArchivo();
  }

}
