import { Auditoria } from "../core/Auditoria";
import { AjusteStockDetalle } from "./AjusteStockDetalle";
import { MotivosAjuste } from "./MotivosAjuste";

export class AjusteStock {
    idTrans?: number;
    idBodega!: number;
    documento!: string;
    nroDocum!: number;
    idCalculo!: number;
    idEstado !: number;
    idMotivo !: number;
    observacion !: string;
    fechaMovimiento!: Date;
    vista !: string;
    fechaMod!: Date;
    detalles!: AjusteStockDetalle[];
    logs!: Auditoria[];
}