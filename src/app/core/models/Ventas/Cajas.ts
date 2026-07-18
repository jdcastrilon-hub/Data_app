import { Auditoria } from "../core/Auditoria";
import { ClienteSearch } from "../../interfaces/Comercial/ClienteSearch";

export class CajaUsuario {
    idUsuario!: number;
    usuario!: { usuario: string; nombreCompleto: string };
}

export class Cajas {
    id?: number;
    idEmp!: number;
    idSucursal!: number;
    codCaja!: string;
    nomCaja!: string;
    cajaPos!: boolean;
    horasTurno?: number;
    status!: boolean;
    idCliente!: number;
    idBodega!: number;
    idEstado!: number;
    documento!: string;
    fechaMod!: Date;
    logs!: Auditoria[];
    usuarios!: CajaUsuario[];
    sucursal!: { nomSucursal: string };
    cliente!: ClienteSearch;
}
