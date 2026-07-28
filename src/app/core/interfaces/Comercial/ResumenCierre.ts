import { ResumenCierreLinea } from './ResumenCierreLinea';

export interface ResumenCierre {
    idTurno: number;
    impBase: number;
    nomCaja: string;
    lineas: ResumenCierreLinea[];
}
