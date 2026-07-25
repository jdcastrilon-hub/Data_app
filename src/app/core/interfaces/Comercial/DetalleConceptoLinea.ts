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
    // 'Factura' o 'MovimientoCaja' - el boton de "ver detalle" (nivel 3) solo
    // aplica a facturas, idTrans de un movimiento de caja no es una venta real.
    tipo: 'Factura' | 'MovimientoCaja';
}
