export interface CargaPreciosListView {
    idTrans: number;
    nroDocum: number;
    fechaCarga: Date;
    observacion: string;
    nombreArchivo: string;
    lista: { nombre: string } | null;
}
