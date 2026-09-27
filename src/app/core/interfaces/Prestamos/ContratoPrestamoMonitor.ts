export class ContratoPrestamoMonitor {
    idTrans!: number;
    nroDocum!: number;
    fecDesembolso!: string;
    fecFin!: string;
    idCliente!: number;
    codTit?: string;
    nomCliente?: string;
    capital!: number;
    tasaPct!: number;
    numCuotas!: number;
    valorCuota!: number;
    saldo!: number;
    idEstado!: string;
    cobrador?: string | null;
}

export class MonitorContratos {
    totalElements!: number;
    totalPages!: number;
    number!: number;
    size!: number;
    kpis: any[] = [];
    detalles: ContratoPrestamoMonitor[] = [];
}
