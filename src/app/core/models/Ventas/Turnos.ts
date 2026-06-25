import { Persona } from "../Compras/Personas";
import { Auditoria } from "../core/Auditoria";


export class Turnos {
    id! : number;
    idCaja! : number;
    Fecha?: Date;
    status!: boolean;
    impBase!: number;
    usuario!: string;
    Observacion !:string;
    idCaja_ref! : number;
    Fecha_ref!: string;
    status_ref!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
}

