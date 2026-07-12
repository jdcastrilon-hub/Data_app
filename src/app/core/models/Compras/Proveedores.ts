import { Auditoria } from "../core/Auditoria";
import { Persona } from "./Personas";

export class Proveedores {
    idEmp! : number;
    idProveedor?: number;
    idPersona!: number;
    persona!: Persona;
    codigoTitular!: string;
    razonSocial!: string;
    regimen!: string;
    activo!: boolean;
    observacion!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
}

