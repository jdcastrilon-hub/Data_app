export class stkDisponibleCompra {
    stock !: number;
    costo !: number;
    impuesto !: number;
    porcentaje !: number;
    // % de utilidad (markup) sugerido para el articulo, resuelto por la
    // jerarquia subcategoria -> categoria -> general. null = nada configurado
    // en ningun nivel (no es lo mismo que 0%).
    porc_utilidad?: number | null;

}