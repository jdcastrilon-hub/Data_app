import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { BodegaCombo } from 'src/app/core/interfaces/Bodega/BodegaCombo';
import { MonitorStockFiltroInventario } from 'src/app/core/interfaces/Bodega/MonitorStockFiltroInventario';
import { NegocioCombo } from 'src/app/core/interfaces/Core/NegocioCombo';
import { SucursalCombo } from 'src/app/core/interfaces/Core/SucursalCombo';
import { Categoria } from 'src/app/core/models/Bodega/Categoria';
import { SubCategorias } from 'src/app/core/models/Bodega/SubCategorias';
import { ArticuloSearch } from 'src/app/core/models/Bodega/ArticuloSearch';
import { MatTabsModule } from '@angular/material/tabs';
import { ComboArticuloComponent } from 'src/app/modules/resources/combo-articulo/combo-articulo.component';

@Component({
  selector: 'filtrostock',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatTabsModule,
    MatButtonModule, MatIconModule, MatCardModule, FlexLayoutModule, MatTableModule, ComboArticuloComponent],
  templateUrl: './filtrostock.component.html',
  styleUrl: './filtrostock.component.scss'
})
export class FiltrostockComponent {

  @Input() reporteActual: string = 'compras'; // Recibe qué reporte seleccionó el usuario
  @Input() obj_filtros!: MonitorStockFiltroInventario;

  @Output() alConsultar = new EventEmitter<any>();

  @ViewChild(ComboArticuloComponent) comboArticuloRef!: ComboArticuloComponent;

  // Articulos seleccionados para filtrar el reporte (tab "Articulos")
  articulosSeleccionados: ArticuloSearch[] = [];
  columnasArticulos: string[] = ['codArticulo', 'nomArticulo', 'acciones'];

  //Negocios
  list_negocios: NegocioCombo[] = [];
  SelectNegocioControl = new FormControl<NegocioCombo | null | "TODOS">("TODOS", Validators.required);

  // Categorias
  lista_categorias: Categoria[] = [];
  lista_Subcategorias: SubCategorias[] = [];
  SelectCategoriaControl = new FormControl<Categoria | null | "TODOS">("TODOS", Validators.required);
  SelectSubCategoriaControl = new FormControl<SubCategorias | null | "TODOS">("TODOS", Validators.required);

  //Seleccion para sucursales.
  list_sucursal: SucursalCombo[] = [];
  SelectSucursalControl = new FormControl<SucursalCombo | null>(null, Validators.required);

  //Bodegas
  list_bodegas: BodegaCombo[] = [];
  SelectBodegasControl = new FormControl<BodegaCombo | null | "TODOS">("TODOS", Validators.required);

  filtro: {
    negocio: string | number; // <--- Permitimos ambos tipos
    bodega: string | number;
    categoria: string | number;
    subcategoria: string | number;
    soloAlzas: boolean;
    articulos: number[];
  } = {
      negocio: 'TODOS',
      bodega: 'TODOS',
      categoria: 'TODOS',
      subcategoria: 'TODOS',
      soloAlzas: false,
      articulos: []
    };

  ngOnInit(): void {
    console.log("Carga Inicial");
    this.cargarFiltros();

    //Subcribir los cambios al selecionar la sucursal
    this.SelectSucursalControl.valueChanges.subscribe(objectoSucusal => {
      if (objectoSucusal) {
        this.list_bodegas = objectoSucusal.list_bodegas!;
        console.log("tamaño lista")
        console.log(this.list_bodegas.length)


      } else {
        this.list_bodegas = []; // Limpiar si no hay categoría seleccionada
      }
    });

    //Subcribir los cambios al selecionar la categoria
    this.SelectCategoriaControl.valueChanges.subscribe(categoria => {
      // 1. Verificamos que no sea null y que no sea el string "TODOS"
      if (categoria && typeof categoria === 'object') {
        // Aquí TS ya sabe que es un objeto tipo Categoria
        this.lista_Subcategorias = categoria.subCategorias || [];
      } else {
        // 2. Si es "TODOS" o null, vaciamos la lista de subcategorías
        this.lista_Subcategorias = [];

        // Opcional: Si quieres que al cambiar la categoría se resetee el selector de subcategoría
        this.SelectSubCategoriaControl.setValue('TODOS');
      }

      if (categoria === 'TODOS') {
        this.filtro.categoria = 'TODOS';
      } else if (categoria && typeof categoria === 'object') {
        // Aquí TS ya sabe que 'valor' es de tipo NegocioCombo
        this.filtro.categoria = categoria.id ?? 0;
      }


    });

    //Subcribir los cambios al selecionar negocio
    this.SelectNegocioControl.valueChanges.subscribe(valor => {
      if (valor === 'TODOS') {
        this.filtro.negocio = 'TODOS';
      } else if (valor && typeof valor === 'object') {
        // Aquí TS ya sabe que 'valor' es de tipo NegocioCombo
        this.filtro.negocio = valor.idNegocio ?? 0;
      }
    });

    //Subcribir los cambios al selecionar subCategoria
    this.SelectSubCategoriaControl.valueChanges.subscribe(valor => {
      if (valor === 'TODOS') {
        this.filtro.subcategoria = 'TODOS';
      } else if (valor && typeof valor === 'object') {
        // Aquí TS ya sabe que 'valor' es de tipo NegocioCombo
        this.filtro.subcategoria = valor.id ?? 0;
      }
    });

    //Subcribir los cambios al selecionar bodega
    this.SelectBodegasControl.valueChanges.subscribe(valor => {
      if (valor === 'TODOS') {
        this.filtro.bodega = 'TODOS';
      } else if (valor && typeof valor === 'object') {
        // Aquí TS ya sabe que 'valor' es de tipo NegocioCombo
        this.filtro.bodega = valor.id ?? 0;
      }
    });


  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['obj_filtros'] && changes['obj_filtros'].currentValue) {
      this.cargarFiltros();
    }
  }

  cargarFiltros() {
    if (!this.obj_filtros) return;
    console.log("carga filtros")
    console.log(this.obj_filtros);

    //if (!this.obj_filtros) return;

    // 1. Asignación directa de las listas
    this.list_negocios = this.obj_filtros.listnegocio || [];
    this.lista_categorias = this.obj_filtros.listCategorias || [];
    this.list_sucursal = this.obj_filtros.listsucursales || [];

    console.log("carga datos")
    // El negocio inicia en "TODOS" (a diferencia de la sucursal, que si requiere un valor puntual)
    const objsucural = this.list_sucursal[0]
    if (objsucural) {
      this.SelectSucursalControl.setValue(objsucural);


    }
  }

  enviarConsulta() {
    this.alConsultar.emit(this.filtro);
  }

  agregarArticulo(articulo: ArticuloSearch) {
    if (articulo) {
      const yaExiste = this.articulosSeleccionados.some(a => a.idArticulo === articulo.idArticulo);
      if (!yaExiste) {
        this.articulosSeleccionados = [...this.articulosSeleccionados, articulo];
        this.filtro.articulos = this.articulosSeleccionados.map(a => a.idArticulo!);
      }
    }
    // Reiniciamos el buscador para poder agregar el siguiente articulo
    this.comboArticuloRef?.resetCampo();
  }

  quitarArticulo(articulo: ArticuloSearch) {
    this.articulosSeleccionados = this.articulosSeleccionados.filter(a => a.idArticulo !== articulo.idArticulo);
    this.filtro.articulos = this.articulosSeleccionados.map(a => a.idArticulo!);
  }

}
