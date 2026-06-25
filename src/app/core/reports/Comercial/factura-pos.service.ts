import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';

// Extraemos la instancia real de ejecución sin modificarla
const pdfMakeInstance: any = (pdfMake as any).default || pdfMake;

@Injectable({
  providedIn: 'root'
})
export class FacturaPosService {

  constructor() { }

  /**
   * Genera el PDF y retorna una Promesa con la URL temporal del Blob
   */
  public generarUrlFactura(data: any): Promise<string> {
    console.log("generarUrlFactura - Iniciando proceso");
    console.log(data)

    return new Promise((resolve, reject) => {
      try {
        const docDefinition: any = {
          pageSize: { width: 226.77, height: 'auto' },
          pageMargins: [8, 10, 8, 10],
          content: [
            { text: 'MI EMPRESA S.A.S.', style: 'header', alignment: 'center' },
            { text: 'NIT: 900.123.456-7', alignment: 'center', fontSize: 8 },
            { text: `Factura: ${data.consecutivo || ''}`, alignment: 'center', fontSize: 9, bold: true },
            { text: `Fecha: ${data.fecha || ''}`, alignment: 'center', fontSize: 8, margin: [0, 2, 0, 5] },
            { text: `Cliente: ${data.cliente || ''}`, fontSize: 8, margin: [0, 0, 0, 5] },
            { text: '--------------------------------------------------', alignment: 'center', fontSize: 8 },
            {
              style: 'tablaDetalle',
              table: {
                widths: ['*', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Item', bold: true },
                    { text: 'Cant', bold: true, alignment: 'center' },
                    { text: 'Total', bold: true, alignment: 'right' }
                  ],
                  ...(data.items || []).map((item: any) => [
                    { text: item.refCompras || '' },
                    { text: (item.cantidad || 0).toString(), alignment: 'center' },
                    { text: `$${((item.cantidad || 0) * (item.precio || 0)).toLocaleString()}`, alignment: 'right' }
                  ])
                ]
              },
              layout: 'noBorders'
            },
            { text: '--------------------------------------------------', alignment: 'center', fontSize: 8, margin: [0, 5] },
            {
              columns: [
                { text: 'NETO:', bold: true, fontSize: 10 },
                { text: `$${(data.neto || 0).toLocaleString()}`, bold: true, fontSize: 10, alignment: 'right' }
              ]
            },
            {
              columns: [
                { text: 'IVA (19%):', bold: true, fontSize: 10 },
                { text: `$${(data.impIVA || 0).toLocaleString()}`, bold: true, fontSize: 10, alignment: 'right' }
              ],
              margin: [0, 2, 0, 0] // Un pequeño margen superior opcional
            },
            {
              columns: [
                { text: 'TOTAL A PAGAR:', bold: true, fontSize: 10 },
                { text: `$${(data.total || 0).toLocaleString()}`, bold: true, fontSize: 10, alignment: 'right' }
              ],
              margin: [0, 4, 0, 0]
            },
            { text: '¡Gracias por su compra!', alignment: 'center', fontSize: 8, margin: [0, 15, 0, 0] }
          ],
          styles: {
            header: { fontSize: 12, bold: true, margin: [0, 0, 0, 2] },
            tablaDetalle: { fontSize: 8, margin: [0, 5, 0, 5] }
          },
          defaultStyle: {
            font: 'Roboto'
          },
          fonts: {
            Roboto: {
              normal: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Regular.ttf',
              bold: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Bold.ttf'
            }
          }
        };

        console.log("Invocando createPdf...");
        const pdfDocGenerator = pdfMakeInstance.createPdf(docDefinition);

        // Cambiamos a la API moderna basada en Promesas nativas que soporta pdfMake 
        // para evitar el uso del callback clásico que se colgaba
        console.log("Solicitando Blob mediante Promesa nativa...");

        pdfDocGenerator.getBlob()
          .then((blob: Blob) => {
            console.log("¡Blob generado exitosamente con fuentes URL!");
            const url = URL.createObjectURL(blob);
            resolve(url);
          })
          .catch((err: any) => {
            console.error("Error obteniendo el Blob de la promesa:", err);
            reject(err);
          });
      } catch (error) {
        console.error("Error crítico en el flujo de generarUrlFactura:", error);
        reject(error);
      }
    });
  }
}
