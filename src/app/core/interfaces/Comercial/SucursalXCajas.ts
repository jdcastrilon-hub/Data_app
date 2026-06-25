import { CajaCombo } from "./CajaCombo";

export class SucursalXCajas{
    id? : number;
    idEmpresa! : number;
    codSucursal! : string;
    nomSucursal! : string;
    cajas?: CajaCombo[];
}