import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, startWith } from 'rxjs';
import { LoteDisponible } from 'src/app/core/interfaces/Bodega/LoteDisponible';
import { ArticuloServiceService } from 'src/app/core/services/Bodega/articulo-service.service';
import { ModalCrearLoteComponent } from 'src/app/modules/resources/modal-crear-lote/modal-crear-lote.component';

// Opcion especial usada para representar "crear nuevo lote" dentro del autocompletar.
const OPCION_CREAR = '__crear_nuevo__';

@Component({
  selector: 'combo-lote',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatInputModule],
  templateUrl: './combo-lote.component.html',
  styleUrl: './combo-lote.component.scss'
})
export class ComboLoteComponent implements OnChanges {

  @Input() idArticulo!: number;
  @Input() idLoteActual: number = 0;
  @Output() loteSeleccionado = new EventEmitter<LoteDisponible>();

  searchControl = new FormControl();
  listaLotes: LoteDisponible[] = [];
  opcionesFiltradas: LoteDisponible[] = [];
  textoActual = '';
  readonly OPCION_CREAR = OPCION_CREAR;

  constructor(private articuloService: ArticuloServiceService, private dialog: MatDialog) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idArticulo'] && this.idArticulo) {
      this.cargarLotes();
    }
  }

  cargarLotes(): void {
    this.articuloService.lotesArticulo(this.idArticulo).subscribe({
      next: (data) => {
        this.listaLotes = data;
        this.opcionesFiltradas = data;

        // Si ya viene un lote seleccionado (ej. modo edicion), mostramos su texto.
        if (this.idLoteActual) {
          const actual = this.listaLotes.find(l => l.idLote === this.idLoteActual);
          if (actual) {
            this.searchControl.setValue(actual, { emitEvent: false });
          }
        }
      },
      error: (err) => console.error('Error cargando lotes', err)
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      startWith('')
    ).subscribe(valor => {
      const texto = typeof valor === 'string' ? valor : (valor?.codigoLote || '');
      this.textoActual = texto;
      this.opcionesFiltradas = this.listaLotes.filter(l =>
        l.codigoLote.toLowerCase().includes(texto.toLowerCase())
      );
    });
  }

  mascaraSalida = (lote: LoteDisponible): string => {
    return lote && lote.codigoLote ? lote.codigoLote : '';
  };

  onSelected(event: MatAutocompleteSelectedEvent): void {
    const seleccion = event.option.value;

    if (seleccion === OPCION_CREAR) {
      this.abrirCrearLote();
      return;
    }

    this.loteSeleccionado.emit(seleccion);
  }

  abrirCrearLote(): void {
    const dialogRef = this.dialog.open(ModalCrearLoteComponent, {
      width: '450px',
      data: {
        idArticulo: this.idArticulo,
        codigoLotePrefill: this.textoActual
      }
    });

    dialogRef.afterClosed().subscribe((nuevoLote: LoteDisponible) => {
      if (nuevoLote) {
        this.listaLotes = [...this.listaLotes, nuevoLote];
        this.searchControl.setValue(nuevoLote, { emitEvent: false });
        this.loteSeleccionado.emit(nuevoLote);
      } else {
        // El usuario cancelo la creacion: limpiamos el texto para no dejar un valor invalido.
        this.searchControl.setValue('', { emitEvent: false });
      }
    });
  }

}
