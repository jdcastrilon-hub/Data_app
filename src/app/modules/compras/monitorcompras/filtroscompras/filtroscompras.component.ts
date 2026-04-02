import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProveedorSearch } from 'src/app/core/interfaces/Compras/ProveedorSearch';
import { ComboArticuloComponent } from 'src/app/modules/resources/combo-articulo/combo-articulo.component';
import { ComboBodegaComponent } from 'src/app/modules/resources/combo-bodega/combo-bodega.component';
import { ComboProveedorComponent } from 'src/app/modules/resources/combo-proveedor/combo-proveedor.component';

@Component({
  selector: 'filtroscompras',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatCardModule, FlexLayoutModule, ComboBodegaComponent, ComboProveedorComponent, ComboArticuloComponent],
  templateUrl: './filtroscompras.component.html',
  styleUrl: './filtroscompras.component.scss'
})
export class FiltroscomprasComponent {
  @Input() reporteActual: string = 'compras'; // Recibe qué reporte seleccionó el usuario
  @Output() alConsultar = new EventEmitter<any>();

  filtro = {
    proveedor: 0,
    articulo: '',
    id_bodega: 0,
    fechaInicio: null,
    fechaFin: null,
    soloAlzas: false // Filtro específico para Variación de Costos
  };

  bodegas = [
    { id: 1, nombre: 'Bodega Central' },
    { id: 2, nombre: 'Bodega Norte' }
  ];

  enviarConsulta() {
    this.alConsultar.emit(this.filtro);
  }

  limpiar() {
    this.filtro = { proveedor: 0, articulo: '', id_bodega: 0, fechaInicio: null, fechaFin: null, soloAlzas: false };
  }

  recibirBodega(bodega: any) {
    console.log('El padre recibió la bodega:', bodega);
    this.filtro.id_bodega = bodega.id!;
  }

  recibirArticulo(articulo: any) {
    console.log('El padre recibió del articulo:', articulo);
    this.filtro.articulo = articulo.idArticulo;

  }

  onProveedorChange(proveedor: ProveedorSearch) {
    console.log('onProveedorChange:', proveedor);
    if (proveedor) {
      // Si quieres guardar todo el objeto
      this.filtro.proveedor = proveedor.idProveedor!;

    } else {
      // Caso cuando el usuario presiona la "X" roja
      this.filtro.proveedor = 0;
    }

    //fila.get('search')?.disable(); //Se bloque la primera columna.
  }

  eliminarReferenciaProveedor(): void {
    let proveedor_filtro: ProveedorSearch = {
      idProveedor: 0,
      idPersona: 0,
      codTit: '',
      nombreCompleto: ''
    }

  }
}
