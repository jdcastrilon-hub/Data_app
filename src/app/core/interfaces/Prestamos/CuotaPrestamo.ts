export interface CuotaPrestamo {
    linea: number;
    numCuota: number;
    valorCuota: number;
    fecVenc: string;
    saldoCuota: number;
    idEstado: string;
    fechaMod?: string;
}
