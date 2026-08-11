import { Auditoria } from "../core/Auditoria";
import { ClienteSearch } from "../../interfaces/Comercial/ClienteSearch";

// Reemplaza a las viejas formaPago/idPago de cabecera - una venta puede
// pagarse con mas de un medio de pago (ej. Efectivo + Transferencia).
export class DetallePago {
    id?: number;
    idMediopago!: number;
    importe!: number;
    mediopago?: { tipo: string }; // Solo lectura, para mostrar el tipo al editar/ver.
}

export class Ventas {
    idTrans?: number;
    idEmp!: number;
    idSucursalEmp !: number;
    idCliente!: number;
    idSucursalCliente !: number;
    fecDoc!: Date;
    documento!: string;
    serie!: string;
    nroDocum!: number;
    secuencia!: string;
    factura!: string;
    documentoRef!: string;
    serieRef!: string;
    nroDocumRef!: number;
    documentoRemito!: string;
    serieRemito!: string;
    nroDocumRemito!: number;
    observaciones !: string;
    impIgreso !: number;
    impVuelto !: number;
    fecVenc !: Date;
    idBodega!: number;
    idEstado !: number;
    caja!: string;
    
    vista !: string;
    impNeto !: number;
    tipoDcto !: string;
    porcDescuento !: number;
    impDescuento !: number;
    impTotal !: number;
    idTurno?: number;
    idCaja?: number;
    idLista?: number;
    nomCaja !: string;
    impuesto1 !: string;
    valorImpuesto1 !: number;
    impuesto2 !: string;
    valorImpuesto2 !: number;
    impuesto3 !: string;
    valorImpuesto3 !: number;
    fechaMod!: Date;
    logs!: Auditoria[];
    detalles!: any[];
    detallesPago!: DetallePago[];
    cliente!: ClienteSearch;
    bodega!: { nomBodega: string };

}