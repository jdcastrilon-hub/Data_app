import { Auditoria } from "./Auditoria";
import { Persona } from "../Compras/Personas";

export class Usuario {
    idEmp!: number;
    idUsuario?: number;
    idPersona!: number;
    persona!: Persona;
    usuario!: string;
    clave!: string;
    nomUsuario!: string;
    activo!: boolean;
    fechaMod!: Date;
    logs!: Auditoria[];
}
