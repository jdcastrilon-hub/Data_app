export interface DctoRolItem {
    idRol: number;
    maxDescuento: number;
    rol?: { idRol: number; nombre: string } | null;
}
