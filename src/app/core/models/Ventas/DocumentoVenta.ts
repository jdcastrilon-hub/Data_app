import { Auditoria } from "../core/Auditoria";

export class DocumentoVenta {
    idEmpresa!: number;
    idSucursal!: number;
    documento!: string;
    descripcion!: string;
    serie!: string;
    clase!: string;
    secuencia!: string;
    aplicaPos!: string;
    activo!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
    sucursal!: { nomSucursal: string };
}
