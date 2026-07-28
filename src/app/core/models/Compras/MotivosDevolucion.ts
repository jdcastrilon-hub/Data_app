import { Auditoria } from "../core/Auditoria";

export class MotivosDevolucion {
    idMotivo!: number;
    idEmp!: number;
    codMotivo!: string;
    nomMotivo!: string;
    activo!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
}
