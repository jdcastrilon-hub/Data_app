import { Auditoria } from "../core/Auditoria";

export class Impuesto {
    id?: number;
    // No se selecciona: siempre es la empresa de la sesion actual.
    idEmp!: number;
    idTipo!: number;
    tasaImpuesto!: string;
    nombreTasa!: string;
    exenta!: string;
    porcentaje!: number;
    impMinimo!: number;
    cuentaVenta!: string;
    cuentaCompra!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
}
