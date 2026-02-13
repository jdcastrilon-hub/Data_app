import { Auditoria } from "../core/Auditoria";

export class Bodega {
    id?: number;
    idSucursal!: number;
    codBodega!: string;
    nomBodega!: string;
    bodegaPrincipal!: string;
    manejaUbicaciones!: string;
    activo!: string;
    fechaMod!: Date;
    logs!: Auditoria[];

}