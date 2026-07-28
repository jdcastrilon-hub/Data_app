import { DetalleUserEmpresa } from "./DetalleUserEmpresa";
import { DetalleUser } from "./DetalleUserLogin";

export class UsuarioLogin {
    token?: string;
    token_type!: number;
    user!: DetalleUser;
    empresa !:DetalleUserEmpresa;
}
