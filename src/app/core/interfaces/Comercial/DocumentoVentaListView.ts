export class DocumentoVentaListView {
    idSucursal ! : number;
    documento ! : string;
    descripcion ! : string;
    serie ! : string;
    clase ! : string;
    aplicaPos ! : string;
    activo ! : string;
    fechaMod ! : Date;
    sucursal !: { nomSucursal: string };
}
