import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ModuloCombo, RolCombo, FormularioMatriz, AccionMatriz } from 'src/app/core/interfaces/Core/PermisosMatriz';
import { PermisosService } from 'src/app/core/services/core/permisos.service';
import { NotificacionesService } from 'src/app/core/services/core/notificaciones.service';

// Orden y etiquetas fijas de las columnas de la matriz (deny-by-default: una
// celda sin fila en md_menu_permisos para ese formulario se muestra como "—").
const COLUMNAS_ACCIONES: { codigo: string; etiqueta: string }[] = [
  { codigo: 'VER', etiqueta: 'Ver' },
  { codigo: 'CREAR', etiqueta: 'Crear' },
  { codigo: 'EDITAR', etiqueta: 'Editar' },
  { codigo: 'BUSCAR', etiqueta: 'Buscar' },
  { codigo: 'ELIMINAR', etiqueta: 'Eliminar' },
];

@Component({
  selector: 'app-permisos',
  imports: [modules_depencias, ReactiveFormsModule, FormsModule, FlexLayoutModule, MatCheckboxModule],
  templateUrl: './permisos.component.html',
  styleUrl: './permisos.component.scss'
})
export class PermisosComponent {

  columnasAcciones = COLUMNAS_ACCIONES;

  list_modulos: ModuloCombo[] = [];
  list_roles: RolCombo[] = [];

  rolControl = new FormControl<number | null>(null);
  moduloControl = new FormControl<number | null>(null);

  formularios: FormularioMatriz[] = [];
  cargando = false;

  constructor(
    private service: PermisosService,
    private notificacion: NotificacionesService
  ) { }

  ngOnInit() {
    this.service.modulosCombo().subscribe(data => this.list_modulos = data);
    this.service.rolesCombo().subscribe(data => this.list_roles = data);

    this.rolControl.valueChanges.subscribe(() => this.cargarMatriz());
    this.moduloControl.valueChanges.subscribe(() => this.cargarMatriz());
  }

  cargarMatriz() {
    const idRol = this.rolControl.value;
    const idModulo = this.moduloControl.value;

    if (!idRol || !idModulo) {
      this.formularios = [];
      return;
    }

    this.cargando = true;
    this.service.getMatriz(idRol, idModulo).subscribe({
      next: (data) => {
        this.formularios = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar la matriz de permisos:', err);
        this.cargando = false;
      }
    });
  }

  // Busca la accion (Ver/Crear/Editar/Buscar/Eliminar) de un formulario si existe;
  // si no existe (el formulario no la soporta) la celda se muestra como "—".
  buscarAccion(formulario: FormularioMatriz, codigo: string): AccionMatriz | undefined {
    return formulario.acciones.find(a => a.codigo === codigo);
  }

  // "Todas" por linea: marca/desmarca de una sola vez las acciones que ese
  // formulario realmente soporta (las que no tiene, ej. Crear en un reporte, ni
  // se tocan). El checkbox de la columna refleja si ya estan todas marcadas.
  todasMarcadas(formulario: FormularioMatriz): boolean {
    return formulario.acciones.length > 0 && formulario.acciones.every(a => a.otorgado);
  }

  toggleTodas(formulario: FormularioMatriz, marcar: boolean): void {
    formulario.acciones.forEach(a => a.otorgado = marcar);
  }

  guardar() {
    const idRol = this.rolControl.value;
    const idModulo = this.moduloControl.value;
    if (!idRol || !idModulo) {
      return;
    }

    const otorgados = this.formularios
      .flatMap(f => f.acciones)
      .filter(a => a.otorgado)
      .map(a => a.idMenuPermiso);

    this.service.guardarMatriz(idRol, idModulo, otorgados).subscribe({
      next: () => this.notificacion.showSuccess('¡Permisos guardados con éxito!'),
      error: (err) => this.notificacion.showError(err.error?.message || 'No se pudieron guardar los permisos.')
    });
  }

}
