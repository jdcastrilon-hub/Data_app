import { Auditoria } from "./Auditoria";

export class NegocioAdmin {
    id?: number;
    idEmpresa!: number;
    codNegocio!: string;
    nomNegocio!: string;
    activo!: boolean;
    fechaMod!: Date;
    logs!: Auditoria[];
}
