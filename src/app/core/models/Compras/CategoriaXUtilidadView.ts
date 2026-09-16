export class CategoriaXUtilidadView {
    id!: number;
    idCategoria!: number;
    idSubcategoria!: number | null;
    porcUtilidad!: number;
    activo!: boolean;
    fechaMod!: Date;
    categoria!: { nomCategoria: string } | null;
    subcategoria!: { nomSubcategoria: string } | null;
}
