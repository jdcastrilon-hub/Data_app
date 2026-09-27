import { CommonModule } from '@angular/common';
import { Component, ViewChild, output, signal } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ClienteSearch } from 'src/app/core/interfaces/Comercial/ClienteSearch';
import { ComboClienteComponent } from 'src/app/modules/resources/combo-cliente/combo-cliente.component';

type EstadoContrato = 'TODOS' | 'ACTIVO' | 'CANCELADO' | 'RETANQUEADO';

@Component({
  selector: 'filtroscontratos',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatButtonModule, MatIconModule, MatCardModule, MatTableModule, MatTabsModule,
    FlexLayoutModule, ComboClienteComponent],
  templateUrl: './filtroscontratos.component.html',
  styleUrl: './filtroscontratos.component.scss'
})
export class FiltroscontratosComponent {

  alConsultar = output<any>();

  @ViewChild(ComboClienteComponent) comboClienteRef!: ComboClienteComponent;

  // Estados de t_prestamos.id_estado - catalogo fijo, no viene del backend.
  estados: EstadoContrato[] = ['ACTIVO', 'CANCELADO', 'RETANQUEADO'];
  SelectEstadoControl = new FormControl<EstadoContrato>('TODOS');

  // Clientes seleccionados (tab "Clientes")
  clientesSeleccionados: ClienteSearch[] = [];
  columnasClientes: string[] = ['codTit', 'nombreCompleto', 'acciones'];

  // Fechas vacias por defecto = todos los desembolsos (no "hoy" como Compras:
  // un prestamo vive meses, filtrar al dia de hoy dejaria la grilla vacia).
  filtro = signal({
    fechaInicial: null as any,
    fechaFinal: null as any,
    estado: 'TODOS' as EstadoContrato,
    clientes: [] as number[]
  });

  // Suscripcion en el constructor, mismo criterio que filtrosmovimientos.
  constructor() {
    this.SelectEstadoControl.valueChanges.subscribe(estado => {
      this.filtro.update(f => ({ ...f, estado: estado ?? 'TODOS' }));
    });
  }

  enviarConsulta(): void {
    this.alConsultar.emit(this.filtro());
  }

  // combo-cliente emite null al limpiar el campo con la "x" - se ignora.
  agregarCliente(cliente: ClienteSearch | null) {
    if (cliente) {
      const yaExiste = this.clientesSeleccionados.some(c => c.idCliente === cliente.idCliente);
      if (!yaExiste) {
        this.clientesSeleccionados = [...this.clientesSeleccionados, cliente];
        this.actualizarFiltroClientes();
      }
    }
    this.comboClienteRef?.resetCampo();
  }

  quitarCliente(cliente: ClienteSearch) {
    this.clientesSeleccionados = this.clientesSeleccionados.filter(c => c.idCliente !== cliente.idCliente);
    this.actualizarFiltroClientes();
  }

  private actualizarFiltroClientes() {
    this.filtro.update(f => ({ ...f, clientes: this.clientesSeleccionados.map(c => c.idCliente!) }));
  }
}
