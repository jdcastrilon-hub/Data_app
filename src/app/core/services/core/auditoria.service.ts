import { Injectable } from '@angular/core';
import { Auditoria } from '../../models/core/Auditoria';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {

  private readonly usuarioActual = 'juan123'; 

  constructor() { }

  /**
   * Formatea la fecha y hora actual en el formato YYYY-MM-DD HH:mm:ss
   * requerido por el backend.
   */
  private obtenerFechaFormatoBackend(): string {
    const now = new Date();
    // Función simple para añadir un 0 inicial (ej. 4 -> 04)
    const pad = (n: number) => n < 10 ? '0' + n : n;

    // YYYY-MM-DD HH:mm:ss
    const datePart = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    const timePart = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

    return `${datePart} ${timePart}`;
  }

  /**
   * Genera y retorna el objeto de log de auditoría completo.
   * @param esNuevo Indica si la operación es 'Nuevo' (true) o 'Edicion' (false).
   * @returns El objeto LogAuditoria listo para el FormArray.
   */
  public generarLog(evento: string): Auditoria {
    const operacion = evento;
    const fecha = this.obtenerFechaFormatoBackend();

    return {
      operacion: operacion,
      usuario_mod: this.usuarioActual, // Usuario hardcodeado o traído de un servicio de autenticación
      fecha_mod: fecha
    };
  }
}
