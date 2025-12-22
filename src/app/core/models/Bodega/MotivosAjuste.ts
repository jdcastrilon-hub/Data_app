import { Auditoria } from "../core/Auditoria";

export class MotivosAjuste {
    idMotivo!: number;
    codMotivo!: string;
    nomMotivo!: string;
    signo!: number;
    activo!: string;
    ctaInventario!: string;
    fechaMod!: Date;
    logs!: Auditoria[];


}