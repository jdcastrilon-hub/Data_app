import { Auditoria } from "../core/Auditoria";
import { TrasladoBodegasDetalle } from "./TrasladoBodegasDetalle";

export class TrasladoBodegas {
    idTrans?: number;
    idBodega!: number;
    documento!: string;
    nroDocum!: number;
    idCalculo!: number;
    idEstado !: number;
    observacion !: string;
    fechaMovimiento!: Date;
    vista !: string;
    fechaMod!: Date;
    detalles!: TrasladoBodegasDetalle[];
    logs!: Auditoria[];
}