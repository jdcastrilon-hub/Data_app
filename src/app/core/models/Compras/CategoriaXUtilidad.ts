import { Auditoria } from "../core/Auditoria";

export class CategoriaXUtilidad {
    id!: number;
    idEmp!: number;
    idCategoria!: number;
    // null = aplica a toda la categoria ("Toda la categoría" en el combo,
    // nunca un valor vacio sin elegir).
    idSubcategoria!: number | null;
    porcUtilidad!: number;
    activo!: boolean;
    fechaMod!: Date;
    logs!: Auditoria[];
}
