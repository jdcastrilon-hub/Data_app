import { TipoImpuestoSimple } from "../../interfaces/Impuestos/TipoImpuestoSimple";

export class ImpuestoView {
    id!: number;
    tasaImpuesto!: string;
    nombreTasa!: string;
    exenta!: string;
    porcentaje!: number;
    fechaMod!: Date;
    // El backend no le pone alias a este campo anidado (igual que "compra_origen"
    // en devoluciones), llega literal en snake_case.
    tipo_impuesto?: TipoImpuestoSimple;
}
