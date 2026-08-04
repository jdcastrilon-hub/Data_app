import { Categoria } from "../../models/Bodega/Categoria";
import { NegocioCombo } from "../Core/NegocioCombo";
import { SucursalCombo } from "../Core/SucursalCombo";
import { EstadoCombo } from "./EstadoCombo";

export class MonitorStockFiltroInventario{
    idEmpresa! : number;
    listnegocio? : NegocioCombo[];
    listCategorias?: Categoria[];
    listsucursales ? : SucursalCombo[];
    listestados? : EstadoCombo[];
}