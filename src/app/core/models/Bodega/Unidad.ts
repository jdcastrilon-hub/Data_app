import { Auditoria } from "../core/Auditoria";

export class Unidad{
    id?: number; 
    codUnidad!: string;
    nomUnidad!: string;
    esPaquete! :string;
    convertUnidad! : number;
    fechaMod! : Date;
    logs!: Auditoria[];

}