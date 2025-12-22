import { Bodega } from "../Bodega/Bodega";

export class Sucursal{
    id? : number;
    idEmpresa! : number;
    codSucursal! : string;
    nomSucursal! : string;
    list_bodegas?: Bodega[];
}