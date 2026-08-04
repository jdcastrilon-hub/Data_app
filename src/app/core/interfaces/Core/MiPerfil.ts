import { Persona } from '../../models/Compras/Personas';
import { Auditoria } from '../../models/core/Auditoria';

export interface MiPerfilRol {
    idRol: number;
    nombre: string;
}

export interface MiPerfil {
    idUsuario: number;
    usuario: string;
    nomUsuario: string;
    persona: Persona;
    roles: MiPerfilRol[];
    logs: Auditoria[];
}
