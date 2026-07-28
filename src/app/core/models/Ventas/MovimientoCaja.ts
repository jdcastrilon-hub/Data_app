import { Auditoria } from "../core/Auditoria";

export class MovimientoCaja {
    id?: number;
    idConcepto!: number;
    idTurno!: number;
    fecha!: Date;
    observacion?: string;
    importe!: number;
    fechaMod?: Date;
    logs!: Auditoria[];
    concepto?: { nomConcepto: string; signo: number };
}
