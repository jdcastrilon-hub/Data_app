import { BodegaCombo } from "../Bodega/BodegaCombo";
import { PersonaSearch } from "./PersonaSearch";

export class CompraListView{
    id_trans !: number;
    Fecha ! : number;
    NumOC ! : number;
    Remito ! : string;
    Importe ! : number;
    proveedor ! : PersonaSearch;
    bodega !: BodegaCombo;

}