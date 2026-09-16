import { Auditoria } from "../core/Auditoria";
import { DctoRolItem } from "../../interfaces/Comercial/DctoRolItem";

export class ConfComercial {
    idEmp?: number;
    precioCeroEditable!: boolean;
    // Placeholders: sin funcionalidad propia todavia (reimpresion de factura,
    // devolucion de venta) - ver project_data_confcomercial.
    reimpresionFacturaPermitida!: boolean;
    idBodegaDevoluciones!: number | null;
    fechaMod!: Date;
    logs!: Auditoria[];
    rolesDescuento!: DctoRolItem[];
    bodegaDevoluciones!: { nomBodega: string } | null;
}
