export class DetalleCompraLinea {
    cod_barra!: string;
    nom_articulo!: string;
    codigo_lote?: string | null;
    costo!: number;
    cantidad!: number;
    neto!: number;
    porc_dcto!: number;
    importe_dcto!: number;
    porc_iva!: number;
    importe_iva!: number;
    total!: number;
}
