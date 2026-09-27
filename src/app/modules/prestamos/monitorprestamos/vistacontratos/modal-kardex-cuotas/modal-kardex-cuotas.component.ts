import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { CuotaPrestamo } from 'src/app/core/interfaces/Prestamos/CuotaPrestamo';
import { PrestamoService } from 'src/app/core/services/Prestamos/prestamo.service';

export interface ModalKardexCuotasData {
  idTrans: number;
  nroDocum: number;
  nomCliente: string;
}

// Estados de td_prestamos que todavia representan deuda (ver spec: una cuota
// PAGADA o ANULADA nunca cuenta como vencida aunque su fecha ya haya pasado).
const ESTADOS_ABIERTOS = ['PENDIENTE', 'PARCIAL'];

// Kardex de cuotas de UN contrato (td_prestamos), separado de la grilla del
// monitor que solo muestra el saldo agregado de cartera. Reutiliza
// GET /prestamos/search (ya trae el cronograma anidado y valida la empresa
// activa) en vez de un endpoint propio.
@Component({
  selector: 'modal-kardex-cuotas',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule, FlexLayoutModule, MatProgressSpinnerModule],
  templateUrl: './modal-kardex-cuotas.component.html',
  styleUrl: './modal-kardex-cuotas.component.scss'
})
export class ModalKardexCuotasComponent implements OnInit {

  columnasCuotas: string[] = ['numCuota', 'fecVenc', 'valorCuota', 'saldoCuota', 'idEstado', 'diasVencida'];
  cuotas: CuotaPrestamo[] = [];
  numCuotas = 0;
  cargando = false;

  totalValor = 0;
  totalSaldo = 0;

  private readonly hoy = this.soloFecha(new Date());

  constructor(
    public dialogRef: MatDialogRef<ModalKardexCuotasComponent>,
    private service: PrestamoService,
    @Inject(MAT_DIALOG_DATA) public data: ModalKardexCuotasData
  ) { }

  ngOnInit(): void {
    this.consultar();
  }

  consultar(): void {
    this.cargando = true;
    this.service.getById(this.data.idTrans).subscribe({
      next: (prestamo) => {
        this.cuotas = prestamo.cuotas ?? [];
        this.numCuotas = prestamo.numCuotas;
        this.totalValor = this.cuotas.reduce((acc, c) => acc + Number(c.valorCuota), 0);
        this.totalSaldo = this.cuotas.reduce((acc, c) => acc + Number(c.saldoCuota), 0);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando cuotas del prestamo', err);
        this.cargando = false;
      }
    });
  }

  // Dias transcurridos desde el vencimiento, solo para cuotas que siguen
  // abiertas; 0 = al dia (o ya pagada).
  diasVencida(cuota: CuotaPrestamo): number {
    if (!ESTADOS_ABIERTOS.includes(cuota.idEstado)) return 0;
    const [anio, mes, dia] = cuota.fecVenc.split('-').map(Number);
    const vence = new Date(anio, mes - 1, dia);
    const dias = Math.round((this.hoy.getTime() - vence.getTime()) / 86_400_000);
    return dias > 0 ? dias : 0;
  }

  private soloFecha(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }
}
