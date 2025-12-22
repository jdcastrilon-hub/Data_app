import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AjusteStockService } from '../../../core/services/Bodega/ajuste-stock.service';
import { AjusteStockListView } from '../../../core/models/Bodega/AjusteStockListView';

@Component({
  selector: 'ajuste-stock',
  imports: [modules_depencias, RouterModule],
  templateUrl: './ajuste-stock.component.html',
  styleUrl: './ajuste-stock.component.scss'
})
export class AjusteStockComponent {
  lista_ajustes: any[] = [];
  dataSource!: MatTableDataSource<AjusteStockListView>;
  objecto_ajuste!: AjusteStockListView;

  //private nuevaCategoriaSubscription!: Subscription;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: AjusteStockService,
    private router: Router
  ) {
    // this.objecto_ajuste = new AjusteStockListView();
  }

  ngOnInit() {
    this.CargarLista();
  }

  CargarLista() {
    console.log("inicio refrescarTabla");
    this.service.list().subscribe(data => {
      this.lista_ajustes = data;
      this.dataSource = new MatTableDataSource<AjusteStockListView>(this.lista_ajustes);
      this.dataSource.paginator = this.paginator;
    });
    console.log(this.lista_ajustes.length);
  }

  //Edicion del registro
  editarAjusteStock(id: number): void {
    // Navega a '/categoria/edit/5' si el ID es 5
    console.log("Entro a editar");
    console.log(id);
    this.router.navigate(['/ajustestock/edit', id]);
  }
}
