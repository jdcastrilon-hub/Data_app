import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UsuarioView } from 'src/app/core/interfaces/Core/UsuarioView';
import { UsuariosService } from 'src/app/core/services/core/usuarios.service';
import { UsuarioListStateService } from 'src/app/core/services/core/usuario-list-state.service';
import { LoginService } from 'src/app/core/services/core/login.service';

@Component({
  selector: 'app-usuarios',
  imports: [modules_depencias, RouterModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent {

  //Paginador
  lista_usuarios: UsuarioView[] = [];
  dataSource!: MatTableDataSource<UsuarioView>;
  todasLasColumnas: string[] = ['id', 'usuario', 'nombre', 'activo', 'fecha', 'actions'];
  displayedColumns: string[] = [];

  //Buscador (filtra por usuario o nombre en el backend)
  buscadorControl = new FormControl('');

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: UsuariosService,
    private router: Router,
    private listState: UsuarioListStateService,
    private loginService: LoginService
  ) { }

  ngOnInit() {
    // Restaura el filtro/pagina donde haya quedado la ultima vez.
    this.buscadorControl.setValue(this.listState.texto, { emitEvent: false });
    this.paginaActual = this.listState.page;
    this.pageSize = this.listState.size;

    this.cargarUsuariosPaginados();
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarUsuariosPaginados();
    });
  }

  cargarUsuariosPaginados() {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.listState.texto = texto || '';
    this.listState.page = this.paginaActual;
    this.listState.size = this.pageSize;

    // Solo se listan los usuarios asociados a la empresa de la sesion actual.
    this.service.listPaginacion(this.paginaActual, this.pageSize, this.loginService.getIdEmpresaActual()!, texto).subscribe(data => {
      this.lista_usuarios = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<UsuarioView>(this.lista_usuarios);
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarUsuariosPaginados();
  }

  editarUsuario(id: number): void {
    this.router.navigate(['/usuarios/edit', id]);
  }

  visualizarUsuario(id: number): void {
    this.router.navigate(['/usuarios/view', id]);
  }

}
