import { Auditoria } from "../core/Auditoria";
import { Persona } from "./Personas";

export class Proveedores {
    id?: number;
    persona!: Persona;
    codigoTitular!: string;
    razonSocial!: string;
    regimen!: string;
    activo!: string;
    observacion!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
}

