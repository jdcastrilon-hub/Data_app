export class CajaSimpleFiltro {
    id!: number;
    codCaja!: string;
    nomCaja!: string;
}

export class BancoSimpleFiltro {
    id!: number;
    codBanco!: string;
    nomBanco!: string;
}

export class MedioPagoSimpleFiltro {
    id!: number;
    tipo!: string;
}

export class FiltrosTesoreria {
    idEmpresa!: number;
    listCajas: CajaSimpleFiltro[] = [];
    listBancos: BancoSimpleFiltro[] = [];
    listMediosPago: MedioPagoSimpleFiltro[] = [];
    listVistas: string[] = [];
}
