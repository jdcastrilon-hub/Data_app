import { MedioPago } from "../../models/Ventas/medioPago";
import { BodegaCombo } from "../Bodega/BodegaCombo";
import { Documentos_Combo } from "../Comercial/Documentos_Combo";



export class SucursalCombo {
    id?: number;
    idEmpresa!: number;
    codSucursal!: string;
    nomSucursal!: string;
    list_bodegas?: BodegaCombo[];
    documentos?: Documentos_Combo[];
    mediopago?: MedioPago[];
}