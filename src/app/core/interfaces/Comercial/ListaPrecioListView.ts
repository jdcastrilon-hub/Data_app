export class ListaPrecioListView {
    idLista!: number;
    nombre!: string;
    esGeneral!: boolean;
    activo!: boolean;
    cliente!: { idCliente?: number; codTit: string; nombreCompleto: string } | null;
}
