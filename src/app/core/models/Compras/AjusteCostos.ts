import { Auditoria } from "../core/Auditoria";

export class AjusteCostos{
    idTrans?: number;
    idEmp!: number;
    fecDoc!: Date;
    documento!: string;
    idBodega!: number;
    nomBodega!: string;
    idArticulo!: number;
    nomArticulo!: string;
    vista !: string;
    impCostoActual !: number;
    impCostoNuevo !: number;    
    observaciones !: string;
    fechaMod!: Date;    
    logs!: Auditoria[];
   
}
