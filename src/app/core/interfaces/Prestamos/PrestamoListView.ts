export interface PrestamoListView {
    idTrans: number;
    idCliente: number;
    clienteNombre: string | null;
    nroDocum: number;
    fecDesembolso: string;
    capital: number;
    valorCuota: number;
    idEstado: string;
    fechaMod: string;
}
