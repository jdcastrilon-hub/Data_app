import { Categoria } from "../../models/Bodega/Categoria";
import { TipoServicios } from "../../models/Bodega/TipoServicios";
import { NegocioCombo } from "./NegocioCombo";

export class EmpresaByNegocioCategorias{
    idEmpresa! : number;
    nombreEmpresa! : string;
    listnegocio? : NegocioCombo[];
    listCategorias?: Categoria[];
    tipoproductos ?:TipoServicios[];

}