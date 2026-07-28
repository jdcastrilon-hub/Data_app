export class CargaStockDetalle {
    idTrans!: number;
    idArticulo!: number;
    idCodBarra!: number;
    linea!: number;
    idLote!: number;
    idUbicacion!: number;
    costo!: number;
    cantidad!: number;
    precioVenta!: number;
    articulo?: { codArticulo: string; nomArticulo: string };
}
