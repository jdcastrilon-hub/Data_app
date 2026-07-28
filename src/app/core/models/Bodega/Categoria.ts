import { Auditoria } from "../core/Auditoria";
import { SubCategorias } from "./SubCategorias";

export class Categoria{
    id?: number; 
    idEmpresa! : number;
    codCategoria! : string;
    nomCategoria! : string;
    estado! : Boolean;
    fechaMod! : Date;
    subCategorias!: SubCategorias[];
    logs!: Auditoria[];
}