import { MedioPago } from "../../models/Ventas/medioPago";
import { ClienteSearch } from "./ClienteSearch";

export class ValidacionAbrirTurno {
    tieneturno!: string;
    idTurno!: number;
    Fecha!: string;
    idSucursal!: number;
    idBodega! : number;
    idEstado! : number;
    documento!: string;
    nomCaja! : string;
    cliente!: ClienteSearch;
    mediopago?: MedioPago[];
    turnoVencido!: boolean;
    horasTranscurridas?: number;
    horasLimite?: number;

}