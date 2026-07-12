export interface LoteDisponible {
    idLote: number;
    codigoLote: string;
    fecVencimiento: string | null;
    cantidad: number;
    // true solo mientras el lote es "pendiente" (reservado, aun no existe en m_lotes) -
    // le indica al formulario que debe agregarlo a la lista de nuevosLotes al guardar.
    esNuevo?: boolean;
}
