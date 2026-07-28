import { monitorKpi } from "../Compras/monitorKpi";
import { MonitorDetalleVentasRealizadas } from "./MonitorDetalleVentasRealizadas";

export class MonitorVentasvista1 {
    totalElements!: number;
    totalPages!: number;
    number!: number;
    size!: number;
    kpis!: monitorKpi[];
    detalles!: MonitorDetalleVentasRealizadas[];
}
