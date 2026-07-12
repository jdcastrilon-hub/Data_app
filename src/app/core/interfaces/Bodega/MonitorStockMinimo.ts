import { StockMinimoDisponible } from "./StockMinimoDisponible";

export class MonitorStockMinimo {
    totalElements! : number;
    totalPages !: number;
    number ! : number;
    size ! : number;
    totalFaltante! : number;
    detalles !: StockMinimoDisponible[];
}
