import { AjusteStockDetalleId } from "./AjusteStockDetalleId";

export class AjusteStockDetalle {
    id!: AjusteStockDetalleId; // Subnivel
    idUbicacion!: number;
    idLote!: number;
    cantDisp!: number;
    cantidad!: number;
    nombreArticulo? : string;
    codigoArticulo ? : string;
}