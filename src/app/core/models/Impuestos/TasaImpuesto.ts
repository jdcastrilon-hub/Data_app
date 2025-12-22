import { Auditoria } from "../core/Auditoria";

export class TasaImpuesto {
    id?: number;
    tipoImpuesto!: number;
    tasaImpuesto!: number;
    descripcionTasa!: string;
    exenta!: string;
    porcentaje!: number;
    minimoImporte!: number;
    cuentaVenta!: string;
    cuentaCompra!: string;
    fechaMod!: Date;
    logs!: Auditoria[];

}