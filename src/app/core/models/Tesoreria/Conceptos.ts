import { Auditoria } from "../core/Auditoria";

export class ConceptoUsuario {
    idUsuario!: number;
    usuario!: { usuario: string; nombreCompleto: string };
}

export class Conceptos {
    id?: number;
    idEmp!: number;
    nomConcepto!: string;
    signo!: number;
    status!: boolean;
    aplicaLimit!: boolean;
    impLimit?: number;
    fechaMod!: Date;
    logs!: Auditoria[];
    usuarios!: ConceptoUsuario[];
}
