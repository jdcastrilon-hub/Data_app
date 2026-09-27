import { Auditoria } from "../core/Auditoria";
import { CuotaPrestamo } from "../../interfaces/Prestamos/CuotaPrestamo";

// Fase 1 (2026-09-17): originar/consultar. Un contrato ya desembolsado no se
// edita directamente (retanqueo/ajuste de cuotas, fase 2).
export class Prestamo {
    idTrans?: number;
    idCliente!: number;
    clienteNombre?: string | null;
    documento?: string;
    nroDocum?: number;
    fecDesembolso!: Date | string;
    fecFin?: string;
    capital!: number;
    numCuotas!: number;
    tasaPct!: number;
    valorCuota?: number;
    idCaja?: number | null;
    caja?: { nomCaja: string } | null;
    idBanco?: number | null;
    banco?: { nomBanco: string } | null;
    idMediopago!: number;
    mediopago?: { tipo: string } | null;
    idPeriodicidad!: number;
    periodicidad?: { nombre: string; dias: number } | null;
    idFormula!: number;
    formula?: { codigo: string; nombre: string } | null;
    idCobrador?: number | null;
    cobrador?: { nombreCompleto: string } | null;
    idMoneda?: number | null;
    moneda?: { codigo: string; nombre: string } | null;
    idEstado?: string;
    observacion?: string | null;
    fechaMod?: Date;
    logs: Auditoria[] = [];
    cuotas?: CuotaPrestamo[];
}
