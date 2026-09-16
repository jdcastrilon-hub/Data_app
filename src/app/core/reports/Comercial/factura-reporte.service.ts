import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { firstValueFrom } from 'rxjs';
import { EmpresaServiceService } from 'src/app/core/services/core/empresa-service.service';
import { Empresas } from 'src/app/core/models/core/Empresas';

// Extraemos la instancia real de ejecución sin modificarla
const pdfMakeInstance: any = (pdfMake as any).default || pdfMake;

// pdfMake es un modulo singleton (compartido con cualquier otro punto de la
// app que lo importe) y NO trae ningun vfs cargado por defecto - sin esto,
// pdfMakeInstance.fonts.Roboto (que el propio pdfmake ya trae predefinido,
// apuntando a 'Roboto-Medium.ttf' para bold) no logra resolver el archivo y
// createPdf() falla con "File 'Roboto-Medium.ttf' not found in virtual file
// system". Se usa el vfs YA EMBEBIDO en el paquete (Roboto Regular/Medium/
// Italic/MediumItalic en base64) en vez de bajarlo de un CDN externo, para
// no depender de internet en tiempo de impresion.
const fontsVfs = pdfFonts as any;
pdfMakeInstance.vfs = fontsVfs['pdfMake'] ? fontsVfs['pdfMake'].vfs : fontsVfs.vfs;

export type FormatoFactura = 'TIRILLA' | 'CARTA';

@Injectable({
  providedIn: 'root'
})
export class FacturaReporteService {

  constructor(private empresaService: EmpresaServiceService) { }

  /**
   * Genera el PDF de la factura (tirilla o carta) y retorna la URL temporal del Blob.
   */
  public async generarUrlFactura(data: any, formato: FormatoFactura = 'TIRILLA'): Promise<string> {
    const empresa = await firstValueFrom(this.empresaService.getMiEmpresa());

    const docDefinition = formato === 'CARTA'
      ? this.buildCarta(data, empresa)
      : this.buildTirilla(data, empresa);

    const pdfDocGenerator = pdfMakeInstance.createPdf(docDefinition);
    const blob: Blob = await pdfDocGenerator.getBlob();
    return URL.createObjectURL(blob);
  }

  private buildTirilla(data: any, empresa: Empresas): any {
    return {
      pageSize: { width: 226.77, height: 'auto' },
      pageMargins: [8, 10, 8, 10],
      content: [
        { text: empresa.nomEmp || '', style: 'header', alignment: 'center' },
        { text: `NIT: ${empresa.nit || ''}`, alignment: 'center', fontSize: 8 },
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
                { text: item.referencia || '' },
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
          margin: [0, 2, 0, 0]
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
      defaultStyle: { font: 'Roboto' }
    };
  }

  private buildCarta(data: any, empresa: Empresas): any {
    return {
      pageSize: 'LETTER',
      pageMargins: [40, 90, 40, 50],
      header: {
        margin: [40, 20, 40, 0],
        columns: [
          [
            { text: empresa.nomEmp || '', bold: true, fontSize: 12 },
            { text: `NIT: ${empresa.nit || ''}`, fontSize: 9 },
            { text: empresa.direccion || '', fontSize: 9 },
            { text: empresa.telefono ? `Tel: ${empresa.telefono}` : '', fontSize: 9 }
          ],
          [
            { text: 'FACTURA DE VENTA', bold: true, fontSize: 12, alignment: 'right' },
            { text: `No. ${data.consecutivo || ''}`, fontSize: 10, alignment: 'right' },
            { text: `Fecha: ${data.fecha || ''}`, fontSize: 9, alignment: 'right' }
          ]
        ]
      },
      footer: (currentPage: number, pageCount: number) => ({
        margin: [40, 0, 40, 20],
        columns: [
          { text: '¡Gracias por su compra!', fontSize: 8 },
          { text: `Página ${currentPage} de ${pageCount}`, fontSize: 8, alignment: 'right' }
        ]
      }),
      content: [
        { text: `Cliente: ${data.cliente || ''}`, fontSize: 10, margin: [0, 0, 0, 15] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Referencia', bold: true, fillColor: '#eeeeee' },
                { text: 'Cantidad', bold: true, alignment: 'center', fillColor: '#eeeeee' },
                { text: 'Precio Unit.', bold: true, alignment: 'right', fillColor: '#eeeeee' },
                { text: 'Total', bold: true, alignment: 'right', fillColor: '#eeeeee' }
              ],
              ...(data.items || []).map((item: any) => [
                { text: item.referencia || '' },
                { text: (item.cantidad || 0).toString(), alignment: 'center' },
                { text: `$${(item.precio || 0).toLocaleString()}`, alignment: 'right' },
                { text: `$${((item.cantidad || 0) * (item.precio || 0)).toLocaleString()}`, alignment: 'right' }
              ])
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#cccccc'
          }
        },
        {
          margin: [0, 15, 0, 0],
          columns: [
            { text: '', width: '*' },
            {
              width: 'auto',
              table: {
                body: [
                  ['Subtotal:', { text: `$${(data.neto || 0).toLocaleString()}`, alignment: 'right' }],
                  ...(data.impdcto ? [['Descuento:', { text: `$${Number(data.impdcto).toLocaleString()}`, alignment: 'right' }]] : []),
                  ['IVA:', { text: `$${(data.impIVA || 0).toLocaleString()}`, alignment: 'right' }],
                  [{ text: 'TOTAL:', bold: true }, { text: `$${(data.total || 0).toLocaleString()}`, bold: true, alignment: 'right' }]
                ]
              },
              layout: 'noBorders'
            }
          ]
        }
      ],
      defaultStyle: { font: 'Roboto', fontSize: 9 }
    };
  }
}
