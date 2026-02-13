import { TasasCombo } from "../Impuestos/TasasCombo";

export class CompraDisponible{
    idArticulo !: number;
    codArticulo!: string;
    nomArticulo! : string;
    stock!: number;
    ubicacion! : string;
    idLote !: string;
    costo !: number;
    neto !: number;
    objimpuesto1 !: TasasCombo;
    impuesto1 !: string;
    tasaimpuesto1 !: number;
    valor_impu1 !: number;
    total !: number;

}