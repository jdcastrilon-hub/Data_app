import { LoteVencimiento } from "./LoteVencimiento";

export class MonitorVencimientos {
    totalElements! : number;
    totalPages !: number;
    number ! : number;
    size ! : number;
    totalUnidadesEnRiesgo! : number;
    detalles !: LoteVencimiento[];
}
