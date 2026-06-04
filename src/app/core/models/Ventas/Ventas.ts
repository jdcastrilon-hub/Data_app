import { Auditoria } from "../core/Auditoria";


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
    idPago!: number;
    fecVenc !: Date;
    idBodega!: number;
    idEstado !: number;
    vista !: string;
    impNeto !: number;
    tipoDcto !: string;
    porcDescuento !: number;
    impDescuento !: number;
    impTotal !: number;
    codCaja !: string;
    impuesto1 !: string;
    valorImpuesto1 !: number;
    impuesto2 !: string;
    valorImpuesto2 !: number;
    impuesto3 !: string;
    valorImpuesto3 !: number;

    fechaMod!: Date;
    logs!: Auditoria[];

}