import { Articulo } from "./Articulo";

export interface ArticuloPayload {
  articulo: Articulo;
  numeroVenta: number;
}