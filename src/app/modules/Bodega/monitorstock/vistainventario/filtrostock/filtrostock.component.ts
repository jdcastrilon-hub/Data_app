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
import { EstadoCombo } from 'src/app/core/interfaces/Bodega/EstadoCombo';
import { MonitorStockFiltroInventario } from 'src/app/core/interfaces/Bodega/MonitorStockFiltroInventario';
import { NegocioCombo } from 'src/app/core/interfaces/Core/NegocioCombo';
import { SucursalCombo } from 'src/app/core/interfaces/Core/SucursalCombo';
import { Categoria } from 'src/app/core/models/Bodega/Categoria';
import { SubCategorias } from 'src/app/core/models/Bodega/SubCategorias';
import { ArticuloSearch } from 'src/app/core/models/Bodega/ArticuloSearch';
import { MatTabsModule } from '@angular/material/tabs';
import { ComboArticuloComponent } from 'src/app/modules/resources/combo-articulo/combo-articulo.component';
import { FiltroReporteState, MonitorstockFiltrosStateService } from 'src/app/core/services/Bodega/monitorstock-filtros-state.service';

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
  // Si la empresa solo maneja un negocio, el filtro no aporta nada: se oculta y queda fijo en "TODOS".
  mostrarNegocio = true;

  //Estados
  list_estados: EstadoCombo[] = [];
  SelectEstadoControl = new FormControl<EstadoCombo | null | "TODOS">("TODOS", Validators.required);
  // Misma logica que negocio: si solo hay un estado, no vale la pena mostrar el filtro.
  mostrarEstado = true;

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
    estado: string | number;
    soloAlzas: boolean;
    articulos: number[];
  } = {
      negocio: 'TODOS',
      bodega: 'TODOS',
      categoria: 'TODOS',
      subcategoria: 'TODOS',
      estado: 'TODOS',
      soloAlzas: false,
      articulos: []
    };

  // Las suscripciones se registran aca (no en ngOnInit) para garantizar que
  // esten activas ANTES de que corra cargarFiltros() - Angular llama
  // ngOnChanges() antes que ngOnInit() cuando el @Input ya trae un valor no
  // vacio al montar (pasa siempre que se reingresa a este reporte con
  // obj_filtros ya resuelto en el padre). Si las suscripciones se registraban
  // en ngOnInit, ese primer cargarFiltros()-via-ngOnChanges seleccionaba la
  // sucursal sin que nadie estuviera escuchando, y list_bodegas quedaba vacio
  // para siempre en esa instancia - encontrado en vivo al restaurar filtros
  // guardados (bug real, preexistente, pero antes invisible porque nada
  // dependia de que la cascada funcionara en un segundo ingreso).
  constructor(private filtrosState: MonitorstockFiltrosStateService) {
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

    //Subcribir los cambios al selecionar estado
    this.SelectEstadoControl.valueChanges.subscribe(valor => {
      if (valor === 'TODOS') {
        this.filtro.estado = 'TODOS';
      } else if (valor && typeof valor === 'object') {
        this.filtro.estado = valor.id ?? 0;
      }
    });


  }

  ngOnInit(): void {
    console.log("Carga Inicial");
    this.cargarFiltros();
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
    this.list_estados = this.obj_filtros.listestados || [];

    // Si la empresa solo maneja un negocio (o un estado), el select no aporta nada:
    // se oculta y el filtro queda fijo en "TODOS" (equivalente, ya que no hay nada mas para elegir).
    this.mostrarNegocio = this.list_negocios.length !== 1;
    this.mostrarEstado = this.list_estados.length !== 1;

    console.log("carga datos")

    // Si ya habia una consulta previa de este reporte (el usuario cambio de
    // "Tipo de Informe" y volvio), se restaura tal cual quedo en vez del
    // default. Ver MonitorstockFiltrosStateService para el porque.
    const guardado = this.filtrosState.inventario;
    if (guardado) {
      this.restaurarFiltrosGuardados(guardado);
      return;
    }

    // El negocio inicia en "TODOS" (a diferencia de la sucursal, que si requiere un valor puntual)
    const objsucural = this.list_sucursal[0]
    if (objsucural) {
      this.SelectSucursalControl.setValue(objsucural);
    }
  }

  // Reaplica una seleccion de filtros guardada, respetando el mismo orden de
  // dependencias que el usuario seguiria a mano: primero Sucursal (dispara la
  // carga de Bodegas), despues Categoria (dispara la carga de SubCategorias),
  // y recien ahi Bodega/SubCategoria. Si algo guardado ya no existe en las
  // listas actuales (ej. se elimino esa bodega), cae a "TODOS" en vez de
  // fallar - el resto de los campos guardados se restaura igual.
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

    const estado = guardado.filtro.estado === 'TODOS'
      ? 'TODOS'
      : this.list_estados.find(e => e.id === guardado.filtro.estado) ?? 'TODOS';
    this.SelectEstadoControl.setValue(estado);

    this.filtro.soloAlzas = guardado.filtro.soloAlzas;
    this.articulosSeleccionados = guardado.articulosSeleccionados;
    this.filtro.articulos = this.articulosSeleccionados.map(a => a.idArticulo!);
  }

  enviarConsulta() {
    this.alConsultar.emit(this.filtro);
    this.filtrosState.inventario = {
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
    // Reiniciamos el buscador para poder agregar el siguiente articulo
    this.comboArticuloRef?.resetCampo();
  }

  quitarArticulo(articulo: ArticuloSearch) {
    this.articulosSeleccionados = this.articulosSeleccionados.filter(a => a.idArticulo !== articulo.idArticulo);
    this.filtro.articulos = this.articulosSeleccionados.map(a => a.idArticulo!);
  }

}
