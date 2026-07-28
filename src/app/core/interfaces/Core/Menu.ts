export interface Menu {

  id_menu: number;
  codigo: string;
  nombre: string;
  ruta?: string;
  icono?: string;
  es_contenedor: boolean;
  children: Menu[];

}