// Item del universo global de periodicidades (lo que pinta las casillas).
export interface CatalogoPeriodicidadItem {
    id: number;
    nombre: string;
    dias: number;
    observacion: string | null;
}

// Item del universo global de formulas de calculo de cuota.
export interface CatalogoFormulaItem {
    id: number;
    codigo: string;
    nombre: string;
    generaInteresMora: boolean;
}

// Configuracion de Prestamos: singleton por empresa. Las dos listas de ids son
// lo unico que se guarda; los catalogo_* son de solo lectura.
export class ConfPrestamo {
    periodicidadesHabilitadas: number[] = [];
    formulasHabilitadas: number[] = [];
    catalogoPeriodicidades: CatalogoPeriodicidadItem[] = [];
    catalogoFormulas: CatalogoFormulaItem[] = [];
}
