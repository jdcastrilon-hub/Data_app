export class DetalleNotaFactura {
    idTrans?: number;
    linea?: number;
    idArticulo!: number;
    idCodBarra!: number;
    idLote!: number;
    cantidad!: number;
    precioUnit!: number;
    impuesto1!: string;
    idTasaimp1!: number;
    valorImpuesto1!: number;
    impuesto2!: string;
    idTasaimp2!: number;
    valorImpuesto2!: number;
    impuesto3!: string;
    idTasaimp3!: number;
    valorImpuesto3!: number;
    impNeto!: number;
    impTotal!: number;
}
