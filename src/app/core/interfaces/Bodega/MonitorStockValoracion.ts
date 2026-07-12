import { ValoracionDisponible } from "./ValoracionDisponible";

export class MonitorStockValoracion {
    totalElements! : number;
    totalPages !: number;
    number ! : number;
    size ! : number;
    valorTotalInventario! : number;
    detalles !: ValoracionDisponible[];
}
