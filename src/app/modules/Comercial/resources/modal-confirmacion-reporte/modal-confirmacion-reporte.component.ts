import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface AccionReporte {
  label: string;
  // Lazy: el PDF solo se genera cuando el usuario pide este reporte, no al abrir la modal.
  generarUrl: () => Promise<string>;
}

export interface ModalConfirmacionReporteData {
  titulo: string;
  subtitulo?: string;
  acciones: AccionReporte[];
}

// Modal generica reutilizable por cualquier modulo transaccional (factura
// directa, y a futuro devoluciones/cotizaciones/notas): confirma que la
// transaccion ya se grabo y ofrece acciones de reporte bajo demanda, cada
// una abriendo su PDF en pestana nueva (el visor nativo del navegador se
// encarga de zoom/imprimir/descargar sin que nosotros simulemos nada).
// No aplica a POS - ahi la impresion sigue siendo directa/silenciosa.
@Component({
  selector: 'modal-confirmacion-reporte',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './modal-confirmacion-reporte.component.html',
  styleUrl: './modal-confirmacion-reporte.component.scss'
})
export class ModalConfirmacionReporteComponent {
  private dialogRef = inject(MatDialogRef<ModalConfirmacionReporteComponent>);

  generando: string | null = null;
  errorMensaje: string | null = null;
  private urlsGeneradas: string[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: ModalConfirmacionReporteData) { }

  async ejecutar(accion: AccionReporte): Promise<void> {
    if (this.generando) {
      return;
    }
    this.errorMensaje = null;
    this.generando = accion.label;
    try {
      const url = await accion.generarUrl();
      this.urlsGeneradas.push(url);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      this.errorMensaje = 'No se pudo generar el reporte. Intenta de nuevo.';
    } finally {
      this.generando = null;
    }
  }

  cerrar(): void {
    this.urlsGeneradas.forEach(url => URL.revokeObjectURL(url));
    this.dialogRef.close();
  }
}
