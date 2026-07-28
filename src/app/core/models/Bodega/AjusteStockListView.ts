import { BodegaCombo } from "../../interfaces/Bodega/BodegaCombo";
import { EstadoCombo } from "../../interfaces/Bodega/EstadoCombo";
import { MotivosCombo } from "../../interfaces/Bodega/MotivoCombo";

export interface AjusteStockListView {
    idTrans: number; 
    nroDocum: number;
    fechaMovimiento: Date; // Es un string ISO 8601 del backend
    Observaciones : string;
    bodega : BodegaCombo;
    estado : EstadoCombo;
    motivo : MotivosCombo;
}