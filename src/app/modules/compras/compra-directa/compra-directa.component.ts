import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { Compra } from 'src/app/core/models/Compras/Compra';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ComprasService } from 'src/app/core/services/Compras/compras.service';
import { CompraListView } from 'src/app/core/interfaces/Compras/CompraListView';

@Component({
  selector: 'app-compra-directa',
  imports: [modules_depencias, RouterModule],
  templateUrl: './compra-directa.component.html',
  styleUrl: './compra-directa.component.scss'
})
export class CompraDirectaComponent {
  //Objecto Transaccional
  objecto_compra!: Compra;

  //Paginador
  lista_bodegas: CompraListView[] = [];
  dataSource!: MatTableDataSource<CompraListView>;
  todasLasColumnas: string[] = ['id', 'fecha', 'proveedor','numoc','remito','bodega','importe','actions'];
  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 15;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private service: ComprasService,
    private router: Router
  ) {
    this.objecto_compra = new Compra();
  }

  ngOnInit() {
    this.cargarComprasPaginadas();
    this.ValidarColumnas();
    console.log(this.lista_bodegas);
  }

  // 1. Método para cargar datos con paginación
  cargarComprasPaginadas() {
    console.log(`Cargando página: ${this.paginaActual}, tamaño: ${this.pageSize}`);

    // Llama al servicio con los parámetros actuales
    this.service.listPaginacion(this.paginaActual, this.pageSize).subscribe(data => {

      // Mapea la respuesta Page
      this.lista_bodegas = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<CompraListView>(this.lista_bodegas);
    });
  }

  //Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarComprasPaginadas(); // Llama al API con los nuevos parámetros
  }

  //Edicion del registro
  editarBodega(id: number): void {
    // Navega a '/categoria/edit/5' si el ID es 5
    console.log("Entro a editar");
    console.log(id);
    //this.router.navigate(['/bodegas/edit', id]);

  }

  ValidarColumnas() {
    //this.displayedColumns = this.todasLasColumnas;
    this.displayedColumns = this.todasLasColumnas.filter(columna => columna !== 'id');
  }


}
