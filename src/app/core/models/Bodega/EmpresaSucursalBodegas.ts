import { NegocioCombo } from "../../interfaces/Core/NegocioCombo";
import { SucursalCombo } from "../../interfaces/Core/SucursalCombo";

export class EmpresaSucursalBodegas {
    idEmpresa!: number;
    nombreEmpresa !: string;
    sucursales!: SucursalCombo[];
    negocios!: NegocioCombo[];
    
}