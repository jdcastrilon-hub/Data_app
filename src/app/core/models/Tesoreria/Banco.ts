import { Auditoria } from "../core/Auditoria";

export class BancoUsuario {
    idUsuario!: number;
    usuario!: { usuario: string; nombreCompleto: string };
}

export class Banco {
    id?: number;
    idEmpresa!: number;
    codBanco!: string;
    nomBanco!: string;
    nroCuenta!: string;
    activo!: boolean;
    fechaMod!: Date;
    logs!: Auditoria[];
    usuarios!: BancoUsuario[];
}
