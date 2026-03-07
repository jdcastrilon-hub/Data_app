import { Auditoria } from "../core/Auditoria";
import { Persona } from "./Personas";

export class Proveedores {
    idProveedor?: number;
    idPersona!: number;
    persona!: Persona;
    codigoTitular!: string;
    razonSocial!: string;
    regimen!: string;
    activo!: string;
    observacion!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
}

