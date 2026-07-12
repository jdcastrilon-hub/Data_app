import { BodegaCombo } from "./BodegaCombo";
import { EstadoCombo } from "./EstadoCombo";

export interface TrasladoBodegasView {
    idTrans: number;
    nroDocum: number;
    fechaMovimiento: Date;
    Observaciones: string;
    bodegaOrigen: BodegaCombo;
    bodegaDestino: BodegaCombo;
    estadoOrigen: EstadoCombo;
    estadoDestino: EstadoCombo;
}
