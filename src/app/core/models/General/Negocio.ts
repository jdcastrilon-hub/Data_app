import { Auditoria } from "../core/Auditoria";

export class Negocio{
    id?: number; 
    idEmpresa! : number;
    negocio! : string;
    nombreNegocio! : string;
    fecha_mod! : Date;
    logs!: Auditoria[];
}