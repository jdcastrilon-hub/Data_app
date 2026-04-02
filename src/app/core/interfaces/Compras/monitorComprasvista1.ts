import { monitorDetalleComprasRealizadas } from "./monitorDetalleComprasRealizadas";
import { monitorKpi } from "./monitorKpi";

export class monitorComprasvista1 {
    totalElements! : number;
    totalPages !: number;
    number ! : number;
    size ! : number;
    kpis! : monitorKpi;
    detalles !: monitorDetalleComprasRealizadas[];
}

