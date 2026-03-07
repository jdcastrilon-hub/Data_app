import { BodegaCombo } from "../Bodega/BodegaCombo";


export class SucursalCombo{
    id? : number;
    idEmpresa! : number;
    codSucursal! : string;
    nomSucursal! : string;
    list_bodegas?: BodegaCombo[];
}