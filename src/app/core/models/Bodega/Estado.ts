import { Auditoria } from "../core/Auditoria";

export class Estado {
    id?: number;
    idEmpresa!: number;
    codEstado!: string;
    nomEstado!: string;
    activo!: boolean;
    observacion!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
}
