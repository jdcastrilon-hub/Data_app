import { Categoria } from "../Bodega/Categoria";

export class NegocioxCategoriasDTO{
    idNegocio?: number; 
    idEmpresa! : number;
    negocio! : string;
    nombreNegocio! : string;
    listCategorias?: Categoria[];
}