import { Auditoria } from "../core/Auditoria";

export class MediosPago {
    id?: number;
    idEmp!: number;
    tipo!: string;
    orden!: number;
    fechaMod!: Date;
    logs!: Auditoria[];
}
