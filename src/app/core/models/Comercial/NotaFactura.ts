import { Auditoria } from "../core/Auditoria";
import { ClienteSearch } from "../../interfaces/Comercial/ClienteSearch";
import { DetalleNotaFactura } from "./DetalleNotaFactura";

export class NotaFactura {
    idTrans?: number;
    idEmp!: number;
    idSucursal!: number;
    idCliente!: number;
    idTransRef!: number;
    idBodega!: number;
    idEstado!: number;
    idTurno?: number;
    idCaja?: number;
    fecDoc!: Date;
    documento!: string;
    nroDocum!: number;
    serie!: string;
    secuencia!: string;
    factura!: string;
    idMotivo!: number;
    observacion?: string;
    impNeto!: number;
    impuesto1!: string;
    valorImpuesto1!: number;
    impuesto2!: string;
    valorImpuesto2!: number;
    impuesto3!: string;
    valorImpuesto3!: number;
    impTotal!: number;
    vista!: string;
    status!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
    detalles!: DetalleNotaFactura[];
    cliente!: ClienteSearch;
}
