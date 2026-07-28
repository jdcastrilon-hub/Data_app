export class DevolucionCompraLinea {
    nro_devolucion!: number;
    fecha!: string;
    motivo?: string | null;
    cod_barra!: string;
    nom_articulo!: string;
    codigo_lote?: string | null;
    cantidad!: number;
    costo_unit!: number;
    costo_total!: number;
}
