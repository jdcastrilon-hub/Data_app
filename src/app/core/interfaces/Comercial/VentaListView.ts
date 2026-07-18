import { ClienteSearch } from "./ClienteSearch";

export class VentaListView {
    id_trans !: number;
    Fecha ! : number;
    NumDocum ! : number;
    Documento ! : string;
    Importe ! : number;
    cliente ! : ClienteSearch;
    bodega !: { nomBodega: string };
}
