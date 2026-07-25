import { BodegaCombo } from "./BodegaCombo";
import { EstadoCombo } from "./EstadoCombo";

export interface CargaStockListView {
    idTrans: number;
    nroDocum: number;
    fechaMovimiento: Date;
    Observaciones: string;
    nombreArchivo: string;
    bodega: BodegaCombo;
    estado: EstadoCombo;
}
