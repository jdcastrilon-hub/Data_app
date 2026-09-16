export class MovimientoTesoreria {
    idTrans!: number;
    linea!: number;
    fecha!: string;
    tipoCuenta!: 'CAJA' | 'BANCO';
    idCaja?: number;
    nomCaja?: string;
    idBanco?: number;
    nomBanco?: string;
    idMediopago!: number;
    tipoMediopago?: string;
    concepto!: string;
    vista!: string;
    idReferencia!: number;
    importe!: number;
    signo!: number;
}

export class MonitorTesoreria {
    totalElements!: number;
    totalPages!: number;
    number!: number;
    size!: number;
    kpis: any[] = [];
    detalles: MovimientoTesoreria[] = [];
}
