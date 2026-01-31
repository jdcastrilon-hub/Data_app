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
    impuesto1 !: TasasCombo;
    valor_impu1 !: number;
    total !: number;

}