import { Auditoria } from "../core/Auditoria";
import { CargaStockDetalle } from "./CargaStockDetalle";

export class CargaStock {
    idTrans?: number;
    idEmpresa!: number;
    idNegocio!: number;
    idBodega!: number;
    idEstado!: number;
    idProveedor!: number;
    documento!: string;
    nroDocum!: number;
    fechaMovimiento!: Date;
    observacion?: string;
    nombreArchivo?: string;
    vista!: string;
    fechaMod!: Date;
    detalles!: CargaStockDetalle[];
    logs!: Auditoria[];
}
