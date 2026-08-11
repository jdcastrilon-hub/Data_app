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
    // Solo lectura: true en el rol "Admin" base que crea el provisioning de
    // empresa - no se puede eliminar (ver roles.component.ts::eliminarRol).
    esProtegido?: boolean;
}
