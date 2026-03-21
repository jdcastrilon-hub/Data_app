import { Auditoria } from "../core/Auditoria";
import { TrasladoBodegasDetalle } from "./TrasladoBodegasDetalle";

export class TrasladoBodegas {
    idTrans?: number;
    idBodegaOrigen!: number;
    idBodegaDestino!: number;
    idEstadoOrigen !: number;
    idEstadoDestino!: number;
    documento!: string;
    nroDocum!: number;
    idCalculo!: number;
    observacion !: string;
    fechaMovimiento!: Date;
    vista !: string;
    fechaMod!: Date;
    detalles!: TrasladoBodegasDetalle[];
    logs!: Auditoria[];
}
