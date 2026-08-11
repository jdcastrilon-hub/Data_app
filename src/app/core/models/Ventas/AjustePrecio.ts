import { Auditoria } from "../core/Auditoria";

export class AjustePrecio {
    idTrans?: number;
    idEmp!: number;
    fecDoc!: Date;
    documento!: string;
    idLista!: number;
    nomLista!: string;
    idArticulo!: number;
    nomArticulo!: string;
    vista!: string;
    impPrecioActual!: number;
    impPrecioNuevo!: number;
    observaciones!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
}
