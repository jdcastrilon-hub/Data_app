export class CargaPreciosDetalle {
    idTrans!: number;
    idArticulo!: number;
    linea!: number;
    precioVenta!: number;
    articulo?: { codArticulo: string; nomArticulo: string };
}
