import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { ConfPrestamo } from 'src/app/core/models/Tesoreria/ConfPrestamo';
import { ConfprestamoService } from 'src/app/core/services/Tesoreria/confprestamo.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';
import { PermisosStateService } from 'src/app/core/services/core/permisos-state.service';

// Codigo del formulario en md_menu (matriz de permisos)
const MENU_CODIGO = 'TES_CONFPREST';

@Component({
  selector: 'app-confprestamo',
  standalone: true,
  imports: [modules_depencias, FormsModule, MatCheckboxModule],
  templateUrl: './confprestamo.component.html',
  styleUrl: './confprestamo.component.scss'
})
export class ConfPrestamoComponent {

  objeto: ConfPrestamo = new ConfPrestamo();

  // Ids marcados (Set para toggle O(1); se serializan a array al guardar).
  periodicidadesSel = new Set<number>();
  formulasSel = new Set<number>();

  guardando = false;
  // Segun el permiso del rol sobre TES_CONFPREST - deshabilita Guardar si no
  // lo tiene (igual rebotaria con 403 en el backend).
  puedeEditar = false;

  constructor(
    private service: ConfprestamoService,
    private notificacion: NotificacionesService,
    private permisosState: PermisosStateService
  ) { }

  ngOnInit(): void {
    this.permisosState.cargar().subscribe(() => {
      this.puedeEditar = this.permisosState.tienePermiso(MENU_CODIGO, 'EDITAR');
    });
    this.cargarConfiguracion();
  }

  cargarConfiguracion(): void {
    this.service.getConfPrestamo().subscribe({
      next: (data) => {
        this.objeto = data;
        this.periodicidadesSel = new Set(data.periodicidadesHabilitadas || []);
        this.formulasSel = new Set(data.formulasHabilitadas || []);
      },
      error: (err) => {
        console.error('Error cargando la configuración de préstamos', err);
        this.notificacion.showError('No se pudo cargar la configuración de préstamos.');
      }
    });
  }

  toggle(set: Set<number>, id: number, marcado: boolean): void {
    marcado ? set.add(id) : set.delete(id);
  }

  guardar(): void {
    const payload = {
      periodicidadesHabilitadas: Array.from(this.periodicidadesSel),
      formulasHabilitadas: Array.from(this.formulasSel),
      fechaMod: new Date()
    };

    this.guardando = true;
    this.service.save(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.notificacion.showSuccess('¡Configuración de préstamos guardada con éxito!');
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error guardando la configuración de préstamos', err);
        this.notificacion.showError(err.error?.message || err.message || 'No se pudo guardar la configuración.');
      }
    });
  }
}
