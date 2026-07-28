import { ProveedorSearch } from "./ProveedorSearch";
import { CompraOrigenBusqueda } from "./CompraOrigenBusqueda";

export class DevolucionListView {
    id_trans!: number;
    Fecha!: string;
    NumDevolucion!: number;
    Status!: string;
    Importe!: number;
    proveedor!: ProveedorSearch;
    compra_origen?: CompraOrigenBusqueda;
}
