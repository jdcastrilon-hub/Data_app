import { TrasladoBodegasDetalleId } from "./TrasladoBodegasDetalleId";

export class TrasladoBodegasDetalle {
    id!: TrasladoBodegasDetalleId; // Subnivel
    idUbicacion!: number;
    idLote!: number;
    cantDisp!: number;
    cantidad!: number;
    nombreArticulo? : string;
    codigoArticulo ? : string;
}