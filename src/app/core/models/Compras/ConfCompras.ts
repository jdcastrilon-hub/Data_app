import { Auditoria } from "../core/Auditoria";

export class ConfCompras {
    idEmp?: number;
    // Estado de mercancia por defecto para Compra Directa - el usuario deja de
    // elegirlo en el formulario. Null hasta que la empresa lo configure.
    idEstadoComp!: number | null;
    // Si la empresa digita precio de venta/utilidad directo en Compra Directa
    // (a futuro) o lo maneja aparte por lista de precios.
    actPrecioCompra!: boolean;
    // Ultimo nivel de la jerarquia de utilidad (subcategoria -> categoria ->
    // general en m_categoriasxutilidad). Null = sin configurar (no sugiere
    // precio de venta por esta via).
    porcUtilidadGeneral!: number | null;
    fechaMod!: Date;
    logs!: Auditoria[];
    estadoComp!: { nomEstado: string } | null;
}
