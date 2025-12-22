import { Auditoria } from "../core/Auditoria";

export class TipoCosteo {
    id?: number;
    tipoCosteo!: string;
    nombreCosteo!: string;
    fechaMod!: Date;
    logs!: Auditoria[];

}