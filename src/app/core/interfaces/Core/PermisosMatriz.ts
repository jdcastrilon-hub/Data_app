export class ModuloCombo {
    idModulo!: number;
    nombre!: string;
}

export class RolCombo {
    idRol!: number;
    nombre!: string;
}

export class AccionMatriz {
    idMenuPermiso!: number;
    codigo!: string;
    nombre!: string;
    otorgado!: boolean;
}

export class FormularioMatriz {
    idMenu!: number;
    nombre!: string;
    acciones!: AccionMatriz[];
}
