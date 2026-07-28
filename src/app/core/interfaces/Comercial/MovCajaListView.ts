export interface MovCajaListView {
    Id: number;
    Fecha: string;
    Importe: number;
    Signo: number;
    concepto?: { nomConcepto: string };
}
