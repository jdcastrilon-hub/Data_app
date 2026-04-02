import { NegocioCombo } from "../../interfaces/Core/NegocioCombo";
import { Auditoria } from "../core/Auditoria";
import { CodigosBarra } from "./CodigosBarra";

export class Articulo {
    id_articulo?: number;
    codArticulo!: string;
    nomArticulo!: string;
    idNegocio!: number;
    idsubCategoria!: number;
    idCategoria!: number;
    activoStock!: string;
    stockMin!: number;
    stockMax!: number;
    activoComercial!: string;
    idRef!: number;
    idunidad!: number;
    grupoContable!: string;
    idTipoService!: number;
    cuentaInventario!: string;
    idImpuesto!: number;
    fechaMod!: Date;
    logs!: Auditoria[];
    objnegocio!: NegocioCombo;
    codigosBarra! : CodigosBarra[];


}