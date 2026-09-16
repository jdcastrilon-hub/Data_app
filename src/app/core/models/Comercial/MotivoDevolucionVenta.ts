import { Auditoria } from "../core/Auditoria";

export class MotivoDevolucionVenta {
    idMotivo!: number;
    idEmp!: number;
    codMotivo!: string;
    nomMotivo!: string;
    devuelveDinero!: boolean;
    codigoDian?: number;
    afectaStock!: boolean;
    activo!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
}
