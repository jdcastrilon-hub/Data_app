import { Component, signal, ViewChild, WritableSignal } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Articulo } from '../../../core/models/Bodega/Articulo';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ArticuloServiceService } from '../../../core/services/Bodega/articulo-service.service';
import { FormArticuloComponent } from './form-articulo/form-articulo.component';
import { ArticuloPayload } from '../../../core/models/Bodega/ArticuloPayload';

//interfaz para la creacion de tabs
interface Tab {
  label: string;
  objeto: Articulo;
  evento_ediccion: boolean;
}

@Component({
  selector: 'app-articulos',
  imports: [modules_depencias,FormArticuloComponent],
  templateUrl: './articulos.component.html',
  styleUrls: ['../../dependencias/stylePrincipal.scss'],
})
export class ArticulosComponent {

  lista_Articulos: Articulo[] = [];
  dataSource!: MatTableDataSource<Articulo>;
  objecto_Articulo!: Articulo;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private service: ArticuloServiceService) {
    this.objecto_Articulo = new Articulo();
  }


  ngOnInit() {
    this.refrescarTabla();
  }


  // 📌 Tabs dinámicos
  tabs: WritableSignal<Tab[]> = signal<Tab[]>([]);
  selectedTabIndex = signal(0);

  // 📌 Agregar pestañas dinámicamente
  //Agregar Nueva Pestaña
  addNew(objecto?: Articulo) {
    const label = "Nuevo"
    const objeto = new Articulo();
    const evento_ediccion = false;
    const newTab: Tab = { label, objeto, evento_ediccion };
    this.validacionPestaña(newTab);
  }

  //Agregar Pestaña para edicion
  addTabEdit(objeto: Articulo, operacion: string) {
    console.log("edicion", objeto.id_articulo);
    const label = operacion;
    const evento_ediccion = true;
    const newTab: Tab = { label, objeto, evento_ediccion };
    this.validacionPestaña(newTab);
  }

  validacionPestaña(newTab: Tab) {

    if (newTab.label === "Nuevo") {
      this.tabs.update(tabs => [...tabs, newTab]);
      this.selectedTabIndex.set(this.tabs().length);
    } else {
      const existingTab = this.tabs().find(tab => tab.objeto.id_articulo === newTab.objeto.id_articulo);
      if (!existingTab) {
        this.tabs.update(tabs => [...tabs, newTab]);
        this.selectedTabIndex.set(this.tabs().length);
      } else {
        this.selectedTabIndex.set(this.tabs().indexOf(existingTab) + 1);
      }
    }
  }

  refrescarTabla() {
    this.service.list().subscribe(data => {
      this.lista_Articulos = data;
      this.dataSource = new MatTableDataSource<Articulo>(this.lista_Articulos);
      this.dataSource.paginator = this.paginator;
    });
  }

  // 📌 Eliminar pestaña
  removeTab(index: number) {
    this.tabs.update(tabs => tabs.filter((_, i) => i !== index - 1));
    this.selectedTabIndex.set(Math.max(0, this.selectedTabIndex() - 1));
  }

  addArticulo(objecto_Articulo:  ArticuloPayload) {
   console.log("ingreso a nuevo", objecto_Articulo);
    //capturamos el # del tab 
    const existingTab = this.tabs()[objecto_Articulo.numeroVenta];
  
    if (existingTab?.evento_ediccion) {
        //Editar
        this.service.update(objecto_Articulo.articulo).subscribe(
          response => {
            console.log('Artículo guardado:', response);
            alert('editado exitosamente');
            this.removeTab(objecto_Articulo.numeroVenta + 1);
            this.lista_Articulos = [... this.lista_Articulos, objecto_Articulo.articulo];
            this.refrescarTabla();
          }
        );
    } else {
        //nuevo
        this.service.save(objecto_Articulo.articulo).subscribe(
          response => {
            console.log('Artículo guardado:', response);
            alert('guardado exitosamente');
            this.removeTab(objecto_Articulo.numeroVenta + 1);
            this.lista_Articulos = [... this.lista_Articulos, objecto_Articulo.articulo];
            this.refrescarTabla();
          }
        );
    }
  
  }
  


}
