import { Auditoria } from "../core/Auditoria";
import { CargaPreciosDetalle } from "./CargaPreciosDetalle";

export class CargaPrecios {
    idTrans?: number;
    idEmpresa!: number;
    idLista!: number;
    documento!: string;
    nroDocum!: number;
    fechaCarga!: Date;
    observacion?: string;
    nombreArchivo?: string;
    vista!: string;
    fechaMod!: Date;
    detalles!: CargaPreciosDetalle[];
    lista!: { nombre: string } | null;
    logs!: Auditoria[];
}
