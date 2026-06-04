import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { ProveedorView } from 'src/app/core/interfaces/Compras/ProveedorView';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ProveedorService } from 'src/app/core/services/Compras/proveedor.service';

@Component({
  selector: 'proveedores',
  imports: [modules_depencias, RouterModule],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.scss'
})
export class ProveedoresComponent {

  //Paginador
  lista_proveedor: ProveedorView[] = [];
  dataSource!: MatTableDataSource<ProveedorView>;
  todasLasColumnas: string[] = ['id', 'codtit', 'nombre','activo','actions'];
  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: ProveedorService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarComprasPaginadas();
    this.ValidarColumnas();
    console.log(this.lista_proveedor);
  }

  // 1. Método para cargar datos con paginación
  cargarComprasPaginadas() {
    console.log(`Cargando página: ${this.paginaActual}, tamaño: ${this.pageSize}`);

    // Llama al servicio con los parámetros actuales
    this.service.listPaginacion(this.paginaActual, this.pageSize).subscribe(data => {

      // Mapea la respuesta Page
      this.lista_proveedor = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<ProveedorView>(this.lista_proveedor);
    });
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarComprasPaginadas(); // Llama al API con los nuevos parámetros
  }

  //Edicion del registro
  editarCompra(id: number): void {
    // Navega a '/categoria/edit/5' si el ID es 5
    console.log("Entro a editar");
    console.log(id);
    this.router.navigate(['/compras/edit', id]);

  }

  ValidarColumnas() {
    //this.displayedColumns = this.todasLasColumnas;
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');
  }


}
