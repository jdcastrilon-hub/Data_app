import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, Input, output, Output, signal } from '@angular/core';
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

  reporteActual = signal('compras');
  alConsultar = output<any>();

  filtro = signal({
    proveedor: 0,
    articulo: '',
    id_bodega: 0,
    fechaInicio: null,
    fechaFin: null,
    soloAlzas: false
  });

  // Configuración dinámica por reporte
  private configuracion = {
    compras: { fecha: true, bodega: true, proveedor: true, articulo: true, soloAlzas: false },
    costos: { fecha: false, bodega: true, proveedor: false, articulo: true, soloAlzas: true },
    valoracionInventario: { fecha: false, bodega: true, proveedor: false, articulo: true, soloAlzas: false }
  };

  // Signal computada que devuelve la config del reporte actual
  visible = computed(() => {
    const reporte = this.reporteActual(); 
    return this.configuracion[reporte as keyof typeof this.configuracion] || this.configuracion.compras;
  });

  enviarConsulta() {
    console.log("enviarConsulta")
    console.log(this.filtro);
    this.alConsultar.emit(this.filtro());
  }

  recibirBodega(bodega: any) {
    console.log('El padre recibió la bodega:', bodega);
    this.filtro.update(f => ({ ...f, id_bodega: bodega.id }));
  }

  recibirArticulo(articulo: any) {
    console.log('El padre recibió del articulo:', articulo);
    this.filtro.update(f => ({ ...f, articulo: articulo.idArticulo }));

  }

  onProveedorChange(proveedor: ProveedorSearch) {
    console.log('onProveedorChange:', proveedor);
    if (proveedor) {
      // Si quieres guardar todo el objeto      
      this.filtro.update(f => ({ ...f, proveedor: proveedor.idProveedor! }));

    } else {
      // Caso cuando el usuario presiona la "X" roja
      this.filtro.update(f => ({ ...f, proveedor: 0 }));
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
