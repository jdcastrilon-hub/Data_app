import { monitorKpi } from "../Compras/monitorKpi";
import { MonitorCompraReporteCostosDetalle } from "./MonitorCompraReporteCostosDetalle";

export class MonitorCompraReporteCostos {
    totalElements! : number;
    totalPages !: number;
    number ! : number;
    size ! : number;
    kpis! : monitorKpi;
    detalles !: MonitorCompraReporteCostosDetalle[];
}

