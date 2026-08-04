import { Auditoria } from "../core/Auditoria";
import { ClienteSearch } from "../../interfaces/Comercial/ClienteSearch";

export class ListaPrecioUsuario {
    idUsuario!: number;
    usuario!: { usuario: string; nombreCompleto: string };
}

export class ListaPrecio {
    idLista?: number;
    idEmp!: number;
    nombre!: string;
    idCliente!: number | null;
    esGeneral!: boolean;
    activo!: boolean;
    fechaMod!: Date;
    logs!: Auditoria[];
    usuarios!: ListaPrecioUsuario[];
    cliente!: ClienteSearch | null;
}
