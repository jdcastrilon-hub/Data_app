import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ModuloEmpresa } from 'src/app/core/interfaces/Core/PermisosMatriz';
import { PermisosService } from 'src/app/core/services/core/permisos.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';

@Component({
  selector: 'app-modulos',
  imports: [modules_depencias, MatSlideToggleModule],
  templateUrl: './modulos.component.html',
  styleUrl: './modulos.component.scss'
})
export class ModulosComponent {

  modulos: ModuloEmpresa[] = [];
  cargando = true;

  constructor(
    private service: PermisosService,
    private notificacion: NotificacionesService
  ) { }

  ngOnInit() {
    this.cargarModulos();
  }

  cargarModulos() {
    this.cargando = true;
    this.service.modulosEmpresa().subscribe({
      next: (data) => {
        this.modulos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar los módulos:', err);
        this.cargando = false;
      }
    });
  }

  // Optimista: refleja el cambio de una vez, y lo revierte si el backend lo
  // rechaza (ej. intentar apagar Administracion) - el mensaje del error lo
  // pone el interceptor global.
  onToggle(modulo: ModuloEmpresa, activo: boolean) {
    const valorAnterior = modulo.activo;
    modulo.activo = activo;

    this.service.actualizarModuloEmpresa(modulo.idModulo, activo).subscribe({
      error: (err) => {
        modulo.activo = valorAnterior;
        this.notificacion.showError(err.error?.message || 'No se pudo actualizar el módulo.');
      }
    });
  }

}
