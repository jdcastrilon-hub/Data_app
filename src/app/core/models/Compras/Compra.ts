import { CompraInterfazSucursal } from "../../interfaces/Compras/CompraInterfazSucursal";
import { ProveedorSearch } from "../../interfaces/Compras/ProveedorSearch";
import { CodigosBarra } from "../Bodega/CodigosBarra";
import { Auditoria } from "../core/Auditoria";
import { CompraDetalle } from "./CompraDetalle";

export class Compra {
    idTrans?: number;
    idEmp!: number;
    idSucursal !: number;
    idProveedor!: number;
    fecDoc!: Date;
    documento!: string;
    nroDocum!: number;
    remito !: string;
    status !: string;
    ingresaBodega!: string;
    idBodega!: number;
    idEstado !: number;
    vista !: string;
    impNeto !: number;
    impDescuento !: number;
    impTotal !: number;
    observaciones !: string;
    impuesto1 !: string;
    valorImpuesto1 !: number;
    impuesto2 !: string;
    valorImpuesto2 !: number;
    impuesto3 !: string;
    valorImpuesto3 !: number;
    fechaMod!: Date;    
    logs!: Auditoria[];
    detalles!: CompraDetalle[];
    bodega! : CompraInterfazSucursal; //Para recuperar la sucursal de la compra.
    proveedor! : ProveedorSearch;//Para recuperar el proveedor de la compra.
    nuevoCodigoBarra! : CodigosBarra[]; //Para recuperar listado de nuevos codigos de la compra.
}