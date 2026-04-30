import { Categoria } from "../../models/Bodega/Categoria";
import { NegocioCombo } from "../Core/NegocioCombo";
import { SucursalCombo } from "../Core/SucursalCombo";

export class MonitorComprasFiltros{
    idEmpresa! : number;
    listnegocio? : NegocioCombo[];
    listCategorias?: Categoria[];
    listsucursales ? : SucursalCombo[];
}