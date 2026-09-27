
export class MedioPago {
    id! : number;
    tipo! : string;
    // Solo llenos en medios que liquidan en una cuenta bancaria fija
    // (Transferencia/Tarjeta) - lo usa el formulario de Prestamos para
    // resolver Caja/Banco sin pedirlo aparte (ver form-prestamo.component.ts).
    idBanco?: number | null;
    banco?: { nomBanco: string } | null;
}