import { SucursalXCajas } from "./SucursalXCajas";
import { NegocioCombo } from "../Core/NegocioCombo";
import { Categoria } from "../../models/Bodega/Categoria";
import { ListaPrecioCombo } from "./ListaPrecioCombo";

export class MonitorOperacionesFiltros {
    idEmpresa!: number;
    listsucursales?: SucursalXCajas[];
    listnegocio?: NegocioCombo[];
    listCategorias?: Categoria[];
    listListaPrecio?: ListaPrecioCombo[];
}
