export interface ErrorFilaCarga {
    fila: number;
    mensaje: string;
}

export interface ResumenCargaPrecios {
    totalFilas: number;
    articulosActualizados: number;
}

export interface ResultadoCargaPrecios {
    status: 'success' | 'error';
    message: string;
    errores: ErrorFilaCarga[];
    resumen: ResumenCargaPrecios | null;
    idTrans?: number;
}
