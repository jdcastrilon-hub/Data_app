export class DetalleUserEmpresa {
    idEmp!: number;
    nomEmpresa!: string;
    // Solo viene poblado en la lista de /auth/mis-empresas (selector de
    // modal-cambiar-empresa) - indica cual es la empresa principal actual del usuario.
    esPrincipal?: boolean;
}
