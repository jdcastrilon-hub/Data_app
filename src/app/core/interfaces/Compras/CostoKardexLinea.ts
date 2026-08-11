export class CostoKardexLinea {
    fec_doc!: string;
    documento!: string;
    nro_docum?: number | null;
    vista?: string | null;
    cantidad?: number | null;
    stock_anterior?: number | null;
    costo_anterior!: number;
    costo_movimiento!: number;
    costo_nuevo_promedio!: number;
    usuario_mod?: string | null;
}
