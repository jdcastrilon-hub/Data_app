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
    // Rol/sucursales asignados - se aprovecha el alta/edicion del usuario
    // para asignarlo de una vez, en vez de ir a Roles/Sucursales por
    // separado. idRol es unico: un usuario solo puede tener un rol
    // no-superadmin por empresa.
    idRol?: number | null;
    sucursales!: number[];
}
