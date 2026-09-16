export class MediospagoListView {
    id !: number;
    tipo ! : string;
    orden ! : number;
    banco ?: { nomBanco: string };
    fechaMod ! : Date;
}
