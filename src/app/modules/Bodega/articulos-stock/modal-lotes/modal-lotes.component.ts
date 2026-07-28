import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { LoteDisponible } from 'src/app/core/interfaces/Bodega/LoteDisponible';
import { ArticuloServiceService } from 'src/app/core/services/Bodega/articulo-service.service';

export interface ModalLotesData {
  idArticulo: number;
  codArticulo: string;
  nomArticulo: string;
}

@Component({
  selector: 'modal-lotes',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule, MatProgressSpinnerModule],
  templateUrl: './modal-lotes.component.html',
  styleUrl: './modal-lotes.component.scss'
})
export class ModalLotesComponent {

  columnasLotes: string[] = ['codigoLote', 'fecVencimiento', 'cantidad'];
  lotes: LoteDisponible[] = [];
  cargando = false;

  constructor(
    private service: ArticuloServiceService,
    @Inject(MAT_DIALOG_DATA) public data: ModalLotesData
  ) { }

  ngOnInit(): void {
    this.cargando = true;
    this.service.lotesArticulo(this.data.idArticulo).subscribe({
      next: (data) => {
        this.lotes = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando lotes', err);
        this.cargando = false;
      }
    });
  }

}
