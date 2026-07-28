import { Auditoria } from "../core/Auditoria";
import { ProveedorSearch } from "../../interfaces/Compras/ProveedorSearch";
import { DetalleDevolucion } from "./DetalleDevolucion";

export class Devolucion {
    idTrans?: number;
    idEmp!: number;
    idSucursal!: number;
    idProveedor!: number;
    idCompraOrigen!: number;
    idBodega!: number;
    idEstado!: number;
    fecDoc!: Date;
    documento!: string;
    nroDocum!: number;
    idMotivo!: number;
    observacion!: string;
    status!: string;
    impTotal!: number;
    vista!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
    detalles!: DetalleDevolucion[];
    proveedor!: ProveedorSearch;
}
