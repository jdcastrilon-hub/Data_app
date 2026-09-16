import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, output, signal } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { BancoSimpleFiltro, CajaSimpleFiltro, FiltrosTesoreria, MedioPagoSimpleFiltro } from 'src/app/core/interfaces/Tesoreria/FiltrosTesoreria';

type TipoCuenta = 'TODAS' | 'CAJA' | 'BANCO';

@Component({
  selector: 'filtrosmovimientos',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatButtonModule, MatIconModule, MatCardModule, MatRadioModule, FlexLayoutModule],
  templateUrl: './filtrosmovimientos.component.html',
  styleUrl: './filtrosmovimientos.component.scss'
})
export class FiltrosmovimientosComponent implements OnInit, OnChanges {

  @Input() obj_filtros!: FiltrosTesoreria;
  alConsultar = output<any>();

  list_cajas: CajaSimpleFiltro[] = [];
  list_bancos: BancoSimpleFiltro[] = [];
  list_mediospago: MedioPagoSimpleFiltro[] = [];
  list_vistas: string[] = [];

  SelectTipoCuentaControl = new FormControl<TipoCuenta>('TODAS');
  SelectCajaControl = new FormControl<CajaSimpleFiltro | 'TODAS'>('TODAS');
  SelectBancoControl = new FormControl<BancoSimpleFiltro | 'TODAS'>('TODAS');
  SelectMedioPagoControl = new FormControl<MedioPagoSimpleFiltro | null>(null);
  SelectVistaControl = new FormControl<string | null>(null);

  filtro = signal({
    fechaInicial: null as any,
    fechaFinal: null as any,
    tipoCuenta: 'TODAS' as TipoCuenta,
    idCaja: null as number | null,
    idBanco: null as number | null,
    idMediopago: null as number | null,
    vista: null as string | null
  });

  // Las suscripciones se registran en el constructor, no en ngOnInit - mismo
  // motivo que filtroscompras.component.ts: ngOnChanges puede correr antes que
  // ngOnInit si el @Input ya trae valor al montar.
  constructor() {
    this.SelectTipoCuentaControl.valueChanges.subscribe(tipo => {
      // Al cambiar el tipo de cuenta se limpia la sub-seleccion anterior (evita
      // dejar un idCaja/idBanco "fantasma" filtrando algo que ya no aplica).
      this.SelectCajaControl.setValue('TODAS', { emitEvent: false });
      this.SelectBancoControl.setValue('TODAS', { emitEvent: false });
      this.filtro.update(f => ({ ...f, tipoCuenta: tipo ?? 'TODAS', idCaja: null, idBanco: null }));
    });

    this.SelectCajaControl.valueChanges.subscribe(caja => {
      const idCaja = caja && caja !== 'TODAS' ? caja.id : null;
      this.filtro.update(f => ({ ...f, idCaja }));
    });

    this.SelectBancoControl.valueChanges.subscribe(banco => {
      const idBanco = banco && banco !== 'TODAS' ? banco.id : null;
      this.filtro.update(f => ({ ...f, idBanco }));
    });

    this.SelectMedioPagoControl.valueChanges.subscribe(medio => {
      this.filtro.update(f => ({ ...f, idMediopago: medio?.id ?? null }));
    });

    this.SelectVistaControl.valueChanges.subscribe(vista => {
      this.filtro.update(f => ({ ...f, vista: vista ?? null }));
    });
  }

  ngOnInit(): void {
    this.cargarFiltros();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['obj_filtros'] && this.obj_filtros) {
      this.cargarFiltros();
    }
  }

  cargarFiltros(): void {
    if (!this.obj_filtros) return;
    this.list_cajas = this.obj_filtros.listCajas || [];
    this.list_bancos = this.obj_filtros.listBancos || [];
    this.list_mediospago = this.obj_filtros.listMediosPago || [];
    this.list_vistas = this.obj_filtros.listVistas || [];
  }

  enviarConsulta(): void {
    this.alConsultar.emit(this.filtro());
  }
}
