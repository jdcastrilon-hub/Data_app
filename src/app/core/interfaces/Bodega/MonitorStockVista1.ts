import { monitorKpi } from "../Compras/monitorKpi";
import { MonitorStockDisponibleVista1 } from "./MonitorStockDisponibleVista1";

export class MonitorStockVista1 {
    totalElements! : number;
    totalPages !: number;
    number ! : number;
    size ! : number;
    kpis! : monitorKpi;
    detalles !: MonitorStockDisponibleVista1[];
}

