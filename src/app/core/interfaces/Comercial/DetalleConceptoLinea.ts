// Nivel 2 del drill-down de cierre de turno: una factura individual detras de
// una fila agrupada de la grilla principal (mismo concepto/medio de pago/signo).
export interface DetalleConceptoLinea {
    fecha: string;
    idTrans: number;
    factura: string;
    cliente: string;
    importe: number;
    // Solo distinto de "importe" cuando la factura se pago con mas de un medio
    // (pago mixto) - se muestra "$X de $Y" unicamente en ese caso.
    importeTotalFactura: number;
}
