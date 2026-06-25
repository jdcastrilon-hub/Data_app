import { Persona } from "../Compras/Personas";
import { Auditoria } from "../core/Auditoria";


export class Turnos {
    id! : number;
    idCaja! : number;
    Fecha?: Date;
    status!: boolean;
    impBase!: number;
    usuario!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
}

