import { ClienteSearch } from "./ClienteSearch";
import { FacturaOrigenBusqueda } from "./FacturaOrigenBusqueda";

export class NotaFacturaListView {
    id_trans!: number;
    Fecha!: string;
    NumNota!: number;
    Status!: string;
    Importe!: number;
    cliente!: ClienteSearch;
    factura_origen?: FacturaOrigenBusqueda;
}
