export interface ErrorFilaCarga {
    fila: number;
    mensaje: string;
}

export interface ArticuloNuevoResumen {
    codigo: string;
    nombre: string;
    categoria: string;
    subcategoria: string;
}

export interface ResumenCarga {
    totalFilas: number;
    articulosNuevos: number;
    articulosExistentes: number;
    cantidadTotal: number;
    articulosNuevosDetalle: ArticuloNuevoResumen[];
}

export interface ResultadoCargaStock {
    status: 'success' | 'error';
    message: string;
    errores: ErrorFilaCarga[];
    resumen: ResumenCarga | null;
    idTrans?: number;
}
