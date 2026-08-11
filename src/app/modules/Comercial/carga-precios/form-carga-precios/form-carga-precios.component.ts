import { Component } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { ListaprecioService } from 'src/app/core/services/Ventas/listaprecio.service';
import { ListaPrecioComboTodas } from 'src/app/core/interfaces/Comercial/ListaPrecioComboTodas';
import { ResultadoCargaPrecios } from 'src/app/core/interfaces/Comercial/CargaPreciosResultado';
import { CargaPrecios } from 'src/app/core/models/Ventas/CargaPrecios';
import { CargapreciosService } from 'src/app/core/services/Ventas/cargaprecios.service';

@Component({
  selector: 'form-carga-precios',
  standalone: true,
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    MatDatepickerModule, MatTooltipModule, MatProgressBarModule, RouterModule],
  templateUrl: './form-carga-precios.component.html',
  styleUrl: './form-carga-precios.component.scss'
})
export class FormCargaPreciosComponent {

  //Variables generales
  formulario!: FormGroup;
  objeto!: CargaPrecios;
  titulo_form: string = 'CARGA MASIVA DE PRECIOS';
  isReadOnly: boolean = false;

  //Listas de precio (cualquier lista activa: base o de cliente)
  list_listaprecio: ListaPrecioComboTodas[] = [];
  SelectListaControl = new FormControl<ListaPrecioComboTodas | null>(null, Validators.required);

  //Archivo Excel seleccionado
  archivoSeleccionado: File | null = null;
  nombreArchivo: string = '';

  //Resultado de la validacion/confirmacion
  resultado: ResultadoCargaPrecios | null = null;
  procesando: boolean = false;

  //Plantilla Excel
  descargandoPlantilla: boolean = false;

  constructor(
    private fb: FormBuilder,
    private listaprecioService: ListaprecioService,
    private notificacion: NotificacionesService,
    private cargapreciosService: CargapreciosService,
    private router: Router,
    private route: ActivatedRoute) {
    this.objeto = new CargaPrecios();
  }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      fechaCarga: [new Date(), Validators.required],
      observacion: ['']
    });

    this.isReadOnly = this.route.snapshot.url.some(segment => segment.path === 'view');
    if (this.isReadOnly) {
      this.formulario.disable();
    }

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.titulo_form = 'DETALLE CARGA MASIVA DE PRECIOS';
        this.ModoVer(Number(id));
      } else {
        this.cargarListas();
      }
    });
  }

  //Carga una carga masiva ya procesada, en modo solo lectura.
  ModoVer(id: number): void {
    this.cargapreciosService.getCargaById(id).subscribe({
      next: (data: CargaPrecios) => {
        this.objeto = data;
        this.formulario.patchValue({
          fechaCarga: data.fechaCarga,
          observacion: data.observacion
        });
        this.nombreArchivo = data.nombreArchivo || '';
        this.cargarListas();
      },
      error: (err) => {
        console.error('Error al cargar la carga:', err);
        this.router.navigate(['/cargaprecios']);
      }
    });
  }

  cargarListas(): void {
    this.listaprecioService.listComboActivas().subscribe({
      next: (data: ListaPrecioComboTodas[]) => {
        this.list_listaprecio = data;

        if (this.isReadOnly) {
          const listaActual = this.list_listaprecio.find(l => l.idLista === this.objeto.idLista);
          if (listaActual) {
            this.SelectListaControl.setValue(listaActual);
          }
          this.SelectListaControl.disable();
        } else {
          const listaGeneral = this.list_listaprecio.find(l => l.esGeneral);
          if (listaGeneral) {
            this.SelectListaControl.setValue(listaGeneral);
          }
        }
      },
      error: (err) => {
        console.error('Error cargando listas de precio', err);
      }
    });
  }

  //Descarga la plantilla Excel en blanco con las columnas que espera la carga masiva.
  descargarPlantilla(): void {
    this.descargandoPlantilla = true;
    this.cargapreciosService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'plantilla_carga_precios.xlsx';
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
    return this.formulario.valid && !!this.SelectListaControl.value && !!this.archivoSeleccionado;
  }

  // Cabezal + archivo listos para enviar al API (confirmar=false para validar, true para grabar).
  private construirCabezal() {
    const valor = this.formulario.value;
    return {
      idLista: this.SelectListaControl.value!.idLista,
      fechaCarga: this.formatearFecha(valor.fechaCarga),
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
    this.SelectListaControl.markAsTouched();

    if (!this.camposCabezalValidos()) {
      this.notificacion.showError('Complete el cabezal y seleccione un archivo antes de validar.');
      return;
    }

    this.procesando = true;
    this.cargapreciosService.procesar(this.archivoSeleccionado!, this.construirCabezal(), false).subscribe({
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
    this.cargapreciosService.procesar(this.archivoSeleccionado!, this.construirCabezal(), true).subscribe({
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

  // Al grabar con exito: se conserva la lista elegida (lo usual es seguir cargando
  // archivos para la misma lista), pero se limpian archivo, observacion, resultado y
  // la fecha vuelve a hoy, dejando el formulario listo para una carga nueva.
  private prepararNuevaCarga(): void {
    const listaActual = this.SelectListaControl.value;

    this.formulario.reset({
      fechaCarga: new Date(),
      observacion: ''
    });
    this.SelectListaControl.setValue(listaActual);
    this.quitarArchivo();
  }

  // Solo limpia el archivo cargado (para volver a subirlo); el cabezal se conserva.
  limpiarFormulario(): void {
    this.quitarArchivo();
  }

}
