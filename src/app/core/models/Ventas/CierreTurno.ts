import { Auditoria } from "../core/Auditoria";

export class DetalleCierreTurno {
    id?: number;
    idCierre?: number;
    linea?: number;
    concepto!: string;
    idMediopago!: number;
    signo!: number;
    importeSistema!: number;
    valorUsuario!: number;
    diferencia!: number;
    mediopago?: { tipo: string };
}

export class CierreTurno {
    idTrans?: number;
    idEmp!: number;
    idTurno!: number;
    fechaCierre!: Date;
    observacion?: string;
    impBase!: number;
    impTotal!: number;
    descuadre!: boolean;
    impDescuadre!: number;
    fechaMod?: Date;
    logs!: Auditoria[];
    detalles!: DetalleCierreTurno[];
    turno?: { usuario: string; caja?: { nomCaja: string } };
}
