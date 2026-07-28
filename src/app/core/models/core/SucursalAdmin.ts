import { Auditoria } from "./Auditoria";

export class SucursalUsuario {
    idUsuario!: number;
    usuario!: { usuario: string; nombreCompleto: string };
}

export class SucursalAdmin {
    id?: number;
    idEmpresa!: number;
    codSucursal!: string;
    nomSucursal!: string;
    idCiudad!: number;
    direccion?: string;
    telefono?: string;
    activo!: boolean;
    fechaMod!: Date;
    logs!: Auditoria[];
    usuarios!: SucursalUsuario[];
}
