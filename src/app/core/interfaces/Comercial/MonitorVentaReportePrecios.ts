import { monitorKpi } from "../../interfaces/Compras/monitorKpi";
import { MonitorVentaReportePreciosDetalle } from "./MonitorVentaReportePreciosDetalle";

export class MonitorVentaReportePrecios {
    totalElements!: number;
    totalPages!: number;
    number!: number;
    size!: number;
    kpis!: monitorKpi;
    detalles!: MonitorVentaReportePreciosDetalle[];
}
