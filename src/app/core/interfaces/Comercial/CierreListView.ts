export class CierreListView {
    IdTrans!: number;
    FechaCierre!: Date;
    ImpTotal!: number;
    Descuadre!: boolean;
    ImpDescuadre!: number;
    turno!: { usuario: string; caja?: { nomCaja: string } };
}
