import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, startWith } from 'rxjs';
import { LoteDisponible } from 'src/app/core/interfaces/Bodega/LoteDisponible';
import { ArticuloService } from 'src/app/core/services/Bodega/articulo.service';
import { ModalCrearLoteComponent } from 'src/app/modules/resources/modal-crear-lote/modal-crear-lote.component';

@Component({
  selector: 'combo-lote',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatInputModule],
  templateUrl: './combo-lote.component.html',
  styleUrl: './combo-lote.component.scss'
})
export class ComboLoteComponent implements OnChanges {

  @Input() idArticulo!: number;
  @Input() idLoteActual: number = 0;
  // false en pantallas donde no tiene sentido inventar un lote (ej. ventas: no
  // se puede vender de un lote que no existe todavia) - true por defecto para
  // no cambiar el comportamiento ya usado en ajuste de stock.
  @Input() permitirCrear: boolean = true;
  @Output() loteSeleccionado = new EventEmitter<LoteDisponible>();

  searchControl = new FormControl();
  listaLotes: LoteDisponible[] = [];
  opcionesFiltradas: LoteDisponible[] = [];
  textoActual = '';

  constructor(private articuloService: ArticuloService, private dialog: MatDialog) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idArticulo'] && this.idArticulo) {
      this.cargarLotes();
    }
  }

  cargarLotes(): void {
    // Cambio de articulo: se descarta cualquier seleccion/bloqueo previo, ya no
    // corresponde al lote de un articulo distinto.
    this.searchControl.enable({ emitEvent: false });
    this.searchControl.setValue('', { emitEvent: false });

    this.articuloService.lotesArticulo(this.idArticulo).subscribe({
      next: (data) => {
        this.listaLotes = data;
        this.opcionesFiltradas = data;

        // Si ya viene un lote seleccionado (ej. modo edicion), mostramos su texto
        // y lo dejamos bloqueado igual que una seleccion manual.
        if (this.idLoteActual) {
          const actual = this.listaLotes.find(l => l.idLote === this.idLoteActual);
          if (actual) {
            this.bloquearSeleccion(actual);
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

  // Deja el input en modo "solo lectura" tras una seleccion valida, para que no
  // se pueda escribir encima y desincronizar el texto visible del idLote real
  // que se emitio al formulario padre.
  private bloquearSeleccion(lote: LoteDisponible): void {
    this.searchControl.setValue(lote, { emitEvent: false });
    this.textoActual = lote.codigoLote;
    this.searchControl.disable({ emitEvent: false });
  }

  onSelected(event: MatAutocompleteSelectedEvent): void {
    const seleccion = event.option.value;
    this.bloquearSeleccion(seleccion);
    this.loteSeleccionado.emit(seleccion);
  }

  // Boton "x": libera el input para elegir otro lote y avisa al padre que ya
  // no hay lote valido (idLote 0), para que vuelva a exigirse la seleccion.
  limpiarSeleccion(event?: Event): void {
    event?.stopPropagation();
    this.searchControl.enable({ emitEvent: false });
    this.searchControl.setValue('', { emitEvent: false });
    this.textoActual = '';
    this.opcionesFiltradas = this.listaLotes;
    this.loteSeleccionado.emit({ idLote: 0, codigoLote: '', fecVencimiento: null, cantidad: 0 });
  }

  // Red de seguridad: si el usuario escribio texto libre y nunca eligio una
  // opcion del listado, se descarta al salir del campo (nunca llego a existir
  // un idLote real detras de ese texto).
  // Se difiere un tick: el mousedown sobre una opcion (incluida "+ Crear lote")
  // le quita el foco al input y dispara este blur ANTES de que el click termine
  // de seleccionar la opcion - si esta logica corre en sincrono, borra
  // textoActual/opcionesFiltradas en pleno clic y el @if de la opcion la saca
  // del DOM antes de que optionSelected llegue a emitirse (sin ningun error
  // visible, que era justo el sintoma reportado).
  onBlurInput(): void {
    setTimeout(() => {
      const valor = this.searchControl.value;
      if (typeof valor === 'string' && valor.length > 0) {
        this.searchControl.setValue('', { emitEvent: false });
        this.textoActual = '';
        this.opcionesFiltradas = this.listaLotes;
      }
    });
  }

  abrirCrearLote(): void {
    // Se difiere al siguiente tick: abrir el dialog en el mismo evento
    // "optionSelected" compite con el cierre del propio panel del autocompletar
    // (los dos manipulan el overlay de Angular Material a la vez) - sin esto,
    // el dialog se crea y se destruye casi de inmediato, sin error visible
    // (mismo ajuste ya usado en form-compra-directa.component.ts::enfocarCosto).
    setTimeout(() => {
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
          this.bloquearSeleccion(nuevoLote);
          this.loteSeleccionado.emit(nuevoLote);
        } else {
          // El usuario cancelo la creacion: limpiamos el texto para no dejar un valor invalido.
          this.searchControl.setValue('', { emitEvent: false });
        }
      });
    });
  }

}
