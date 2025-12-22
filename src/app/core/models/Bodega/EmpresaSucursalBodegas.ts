import { Negocio } from "../General/Negocio";
import { Sucursal } from "../General/Sucursal";

export class EmpresaSucursalBodegas {
    idEmpresa!: number;
    nombreEmpresa !: string;
    sucursales!: Sucursal[];
    negocios!: Negocio[];
    
}