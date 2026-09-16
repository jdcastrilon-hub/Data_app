import { Auditoria } from "../core/Auditoria";

export class MediosPago {
    id?: number;
    idEmp!: number;
    tipo!: string;
    orden!: number;
    idBanco?: number;
    banco?: { nomBanco: string };
    fechaMod!: Date;
    logs!: Auditoria[];
}
