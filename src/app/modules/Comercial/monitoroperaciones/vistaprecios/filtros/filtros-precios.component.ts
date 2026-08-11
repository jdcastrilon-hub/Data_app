import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MonitorOperacionesFiltros } from 'src/app/core/interfaces/Comercial/MonitorOperacionesFiltros';
import { NegocioCombo } from 'src/app/core/interfaces/Core/NegocioCombo';
import { ListaPrecioCombo } from 'src/app/core/interfaces/Comercial/ListaPrecioCombo';
import { Categoria } from 'src/app/core/models/Bodega/Categoria';
import { SubCategorias } from 'src/app/core/models/Bodega/SubCategorias';
import { ArticuloSearch } from 'src/app/core/models/Bodega/ArticuloSearch';
import { ComboArticuloComponent } from 'src/app/modules/resources/combo-articulo/combo-articulo.component';
import { FiltroPreciosValores, MonitoroperacionesFiltrosStateService } from 'src/app/core/services/Ventas/monitoroperaciones-filtros-state.service';

@Component({
  selector: 'filtros-precios',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule,
    MatButtonModule, MatIconModule, MatCardModule, FlexLayoutModule, MatTableModule, ComboArticuloComponent],
  templateUrl: './filtros-precios.component.html',
  styleUrl: './filtros-precios.component.scss'
})
export class FiltrosPreciosComponent {
  @Input() obj_filtros!: MonitorOperacionesFiltros;

  @Output() alConsultar = new EventEmitter<any>();

  @ViewChild(ComboArticuloComponent) comboArticuloRef!: ComboArticuloComponent;

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

  // Listas de precio (solo base, sin cliente) - ocupa el lugar de Bodega en Costos.
  list_listasprecio: ListaPrecioCombo[] = [];
  SelectListaControl = new FormControl<ListaPrecioCombo | null | "TODOS">("TODOS", Validators.required);

  filtro: FiltroPreciosValores = {
    negocio: 'TODOS',
    lista: 'TODOS',
    categoria: 'TODOS',
    subcategoria: 'TODOS',
    articulos: []
  };

  constructor(private filtrosState: MonitoroperacionesFiltrosStateService) {
    this.SelectCategoriaControl.valueChanges.subscribe(categoria => {
      if (categoria && typeof categoria === 'object') {
        this.lista_Subcategorias = categoria.subCategorias || [];
      } else {
        this.lista_Subcategorias = [];
        this.SelectSubCategoriaControl.setValue('TODOS');
      }

      if (categoria === 'TODOS') {
        this.filtro.categoria = 'TODOS';
      } else if (categoria && typeof categoria === 'object') {
        this.filtro.categoria = categoria.id ?? 0;
      }
    });

    this.SelectNegocioControl.valueChanges.subscribe(valor => {
      if (valor === 'TODOS') {
        this.filtro.negocio = 'TODOS';
      } else if (valor && typeof valor === 'object') {
        this.filtro.negocio = valor.idNegocio ?? 0;
      }
    });

    this.SelectSubCategoriaControl.valueChanges.subscribe(valor => {
      if (valor === 'TODOS') {
        this.filtro.subcategoria = 'TODOS';
      } else if (valor && typeof valor === 'object') {
        this.filtro.subcategoria = valor.id ?? 0;
      }
    });

    this.SelectListaControl.valueChanges.subscribe(valor => {
      if (valor === 'TODOS') {
        this.filtro.lista = 'TODOS';
      } else if (valor && typeof valor === 'object') {
        this.filtro.lista = valor.idLista ?? 0;
      }
    });
  }

  ngOnInit(): void {
    this.cargarFiltros();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['obj_filtros'] && changes['obj_filtros'].currentValue) {
      this.cargarFiltros();
    }
  }

  cargarFiltros() {
    if (!this.obj_filtros) return;

    this.list_negocios = this.obj_filtros.listnegocio || [];
    this.lista_categorias = this.obj_filtros.listCategorias || [];
    this.list_listasprecio = this.obj_filtros.listListaPrecio || [];

    const guardado = this.filtrosState.precios;
    if (guardado) {
      this.restaurarFiltrosGuardados(guardado.filtro, guardado.articulosSeleccionados);
    }
  }

  private restaurarFiltrosGuardados(guardado: FiltroPreciosValores, articulosGuardados: ArticuloSearch[]) {
    const lista = guardado.lista === 'TODOS'
      ? 'TODOS'
      : this.list_listasprecio.find(l => l.idLista === guardado.lista) ?? 'TODOS';
    this.SelectListaControl.setValue(lista);

    const negocio = guardado.negocio === 'TODOS'
      ? 'TODOS'
      : this.list_negocios.find(n => n.idNegocio === guardado.negocio) ?? 'TODOS';
    this.SelectNegocioControl.setValue(negocio);

    const categoria = guardado.categoria === 'TODOS'
      ? 'TODOS'
      : this.lista_categorias.find(c => c.id === guardado.categoria) ?? 'TODOS';
    this.SelectCategoriaControl.setValue(categoria);

    if (categoria !== 'TODOS' && guardado.subcategoria !== 'TODOS') {
      const subcategoria = this.lista_Subcategorias.find(s => s.id === guardado.subcategoria) ?? 'TODOS';
      this.SelectSubCategoriaControl.setValue(subcategoria);
    }

    this.articulosSeleccionados = articulosGuardados;
    this.filtro.articulos = this.articulosSeleccionados.map(a => a.idArticulo!);
  }

  enviarConsulta() {
    this.alConsultar.emit(this.filtro);
    this.filtrosState.precios = {
      filtro: { ...this.filtro },
      articulosSeleccionados: this.articulosSeleccionados
    };
  }

  agregarArticulo(articulo: ArticuloSearch) {
    if (articulo) {
      const yaExiste = this.articulosSeleccionados.some(a => a.idArticulo === articulo.idArticulo);
      if (!yaExiste) {
        this.articulosSeleccionados = [...this.articulosSeleccionados, articulo];
        this.filtro.articulos = this.articulosSeleccionados.map(a => a.idArticulo!);
      }
    }
    this.comboArticuloRef?.resetCampo();
  }

  quitarArticulo(articulo: ArticuloSearch) {
    this.articulosSeleccionados = this.articulosSeleccionados.filter(a => a.idArticulo !== articulo.idArticulo);
    this.filtro.articulos = this.articulosSeleccionados.map(a => a.idArticulo!);
  }

}
