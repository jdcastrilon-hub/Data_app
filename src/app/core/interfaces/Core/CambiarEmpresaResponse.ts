import { DetalleUserEmpresa } from "./DetalleUserEmpresa";

export class CambiarEmpresaResponse {
    token!: string;
    token_type!: string;
    empresa!: DetalleUserEmpresa;
}
