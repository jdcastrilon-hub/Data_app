import { Auditoria } from "./Auditoria";

export class RolUsuario {
    idUsuario!: number;
    usuario!: { usuario: string; nombreCompleto: string };
}

export class Rol {
    idRol?: number;
    idEmp!: number;
    codigo!: string;
    nombre!: string;
    descripcion?: string;
    activo!: boolean;
    fechaMod!: Date;
    logs!: Auditoria[];
    usuarios!: RolUsuario[];
}
