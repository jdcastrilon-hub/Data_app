export class ListaPrecioComboTodas {
    idLista!: number;
    nombre!: string;
    esGeneral!: boolean;
    cliente!: { idCliente?: number; codTit: string; nombreCompleto: string } | null;
}
