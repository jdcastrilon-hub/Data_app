export class CompraDetalle {
    id!: CompraDetalle;
    refCompras !: string;
    codigoBarras !: string;
    costoUnit !: number;
    // Precio de venta digitado en la compra (opcional por linea, condicionado a
    // m_confcompras.actPrecioCompra). 0 = "sin precio para esta linea".
    impPrecioVta?: number;
    cantidad!: number;
    idLote !:number;
    stock!: number;
    impuesto1 !: string;
    idTasaimp1 !: number;
    valorImpuesto1 !: number;
    impuesto2 !: string;
    idTasaimp2 !: number;
    valorImpuesto2 !: number;
    impuesto3 !: string;
    idTasaimp3 !: number;
    valorImpuesto3 !: number;
    costoTotal !: number;
    importeTotal !:number;
}
