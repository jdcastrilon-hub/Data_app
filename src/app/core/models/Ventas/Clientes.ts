import { Persona } from "../Compras/Personas";
import { Auditoria } from "../core/Auditoria";


export class Clientes {
    idEmp! : number;
    idCliente?: number;
    idPersona!: number;
    persona!: Persona;
    codigoTitular!: string;
    nomCliente!: string;
    direccion!: string;
    mail!: string;
    activo!: boolean;
    observacion!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
}

