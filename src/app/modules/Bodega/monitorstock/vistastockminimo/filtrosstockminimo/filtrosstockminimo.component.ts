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
import { FiltroReporteState, MonitorstockFiltrosStateService } from 'src/app/core/services/Bodega/monitorstock-filtros-state.service';

// Filtros propios de "Stock Minimo" (alertas de reposicion): mismos filtros base
// que Inventario/Valoracion, en su propio componente por si en el futuro se
// necesitan filtros especificos de este reporte.
@Component({
  selector: 'filtrosstockminimo',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatTabsModule,
    MatButtonModule, MatIconModule, MatCardModule, FlexLayoutModule, MatTableModule, ComboArticuloComponent],
  templateUrl: './filtrosstockminimo.component.html',
  styleUrl: './filtrosstockminimo.component.scss'
})
export class FiltrosstockminimoComponent {

  @Input() reporteActual: string = 'stockminimo';
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
    negocio: string | number;
    bodega: string | number;
    categoria: string | number;
    subcategoria: string | number;
    articulos: number[];
  } = {
      negocio: 'TODOS',
      bodega: 'TODOS',
      categoria: 'TODOS',
      subcategoria: 'TODOS',
      articulos: []
    };

  // Las suscripciones se registran aca (no en ngOnInit) para garantizar que
  // esten activas ANTES de que corra cargarFiltros() - Angular llama
  // ngOnChanges() antes que ngOnInit() cuando el @Input ya trae un valor no
  // vacio al montar (pasa siempre que se reingresa a este reporte con
  // obj_filtros ya resuelto en el padre). Ver filtrostock.component.ts para
  // el detalle completo de por que esto rompia list_bodegas.
  constructor(private filtrosState: MonitorstockFiltrosStateService) {
    this.SelectSucursalControl.valueChanges.subscribe(objectoSucusal => {
      if (objectoSucusal) {
        this.list_bodegas = objectoSucusal.list_bodegas!;
      } else {
        this.list_bodegas = [];
      }
    });

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

    this.SelectBodegasControl.valueChanges.subscribe(valor => {
      if (valor === 'TODOS') {
        this.filtro.bodega = 'TODOS';
      } else if (valor && typeof valor === 'object') {
        this.filtro.bodega = valor.id ?? 0;
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
    this.list_sucursal = this.obj_filtros.listsucursales || [];

    // Si ya habia una consulta previa de este reporte (el usuario cambio de
    // "Tipo de Informe" y volvio), se restaura tal cual quedo en vez del
    // default. Ver MonitorstockFiltrosStateService para el porque.
    const guardado = this.filtrosState.stockminimo;
    if (guardado) {
      this.restaurarFiltrosGuardados(guardado);
      return;
    }

    const objsucural = this.list_sucursal[0]
    if (objsucural) {
      this.SelectSucursalControl.setValue(objsucural);
    }
  }

  // Reaplica una seleccion de filtros guardada, respetando el mismo orden de
  // dependencias que el usuario seguiria a mano: primero Sucursal (dispara la
  // carga de Bodegas), despues Categoria (dispara la carga de SubCategorias),
  // y recien ahi Bodega/SubCategoria. Si algo guardado ya no existe en las
  // listas actuales, cae a "TODOS" en vez de fallar.
  private restaurarFiltrosGuardados(guardado: FiltroReporteState<typeof this.filtro>) {
    const sucursal = this.list_sucursal.find(s => s.id === guardado.sucursalId) ?? this.list_sucursal[0];
    if (sucursal) {
      this.SelectSucursalControl.setValue(sucursal);
    }

    const bodega = guardado.filtro.bodega === 'TODOS'
      ? 'TODOS'
      : this.list_bodegas.find(b => b.id === guardado.filtro.bodega) ?? 'TODOS';
    this.SelectBodegasControl.setValue(bodega);

    const negocio = guardado.filtro.negocio === 'TODOS'
      ? 'TODOS'
      : this.list_negocios.find(n => n.idNegocio === guardado.filtro.negocio) ?? 'TODOS';
    this.SelectNegocioControl.setValue(negocio);

    const categoria = guardado.filtro.categoria === 'TODOS'
      ? 'TODOS'
      : this.lista_categorias.find(c => c.id === guardado.filtro.categoria) ?? 'TODOS';
    this.SelectCategoriaControl.setValue(categoria);

    if (categoria !== 'TODOS' && guardado.filtro.subcategoria !== 'TODOS') {
      const subcategoria = this.lista_Subcategorias.find(s => s.id === guardado.filtro.subcategoria) ?? 'TODOS';
      this.SelectSubCategoriaControl.setValue(subcategoria);
    }

    this.articulosSeleccionados = guardado.articulosSeleccionados;
    this.filtro.articulos = this.articulosSeleccionados.map(a => a.idArticulo!);
  }

  enviarConsulta() {
    this.alConsultar.emit(this.filtro);
    this.filtrosState.stockminimo = {
      sucursalId: this.SelectSucursalControl.value?.id ?? null,
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
