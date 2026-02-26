import { Auditoria } from "../core/Auditoria";

export class Articulo {
    id_articulo?: number;
    codArticulo!: string;
    nomArticulo!: string;
    TipoProducto! :string;
    idNegocio!: number;
    idsubCategoria!: number;
    idCategoria!:number;
    activoStock!: string;
    stockMin!: number;
    stockMax!: number;
    activoComercial!: string;
    idRef!: number;
    idunidad!: number;
    grupoContable!: string;
    idCosteo!: number;
    cuentaInventario!: string;
    idImpuesto!: number;
    fechaMod!: Date;
    logs!: Auditoria[];

}