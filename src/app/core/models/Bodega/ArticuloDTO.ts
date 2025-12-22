import { Categoria } from "./Categoria";
import { SubCategorias } from "./SubCategorias";

export class ArticuloDTO {
    id?: number;
    objCategoria?: Categoria;
    subCategoria?: SubCategorias;
}