import { Categoria } from "../Bodega/Categoria";
import { TipoServicios } from "../Bodega/TipoServicios";

export class NegocioxCategoriasDTO{
    idNegocio?: number; 
    idEmpresa! : number;
    negocio! : string;
    nombreNegocio! : string;
    listCategorias?: Categoria[];
    tipoproductos ?:TipoServicios[];

}