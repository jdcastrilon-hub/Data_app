import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'modal-pdfticket',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './modal-pdfticket.component.html',
  styleUrl: './modal-pdfticket.component.scss'
})
export class ModalPdfticketComponent {
  private sanitizer = inject(DomSanitizer);
  private dialogRef = inject(MatDialogRef<ModalPdfticketComponent>);

  public pdfUrlUrlSegura!: SafeResourceUrl;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { url: string }) { }

  ngOnInit(): void {
    // Sanitizamos la URL para que el iframe la pueda renderizar sin bloqueos de seguridad
    this.pdfUrlUrlSegura = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.url);
  }

  mandarAImprimir() {
    // Opcional: si quieren gatillar la impresión nativa desde el modal
    const iframe = document.querySelector('iframe');
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  }

  cerrar() {
    // Revocamos la URL al cerrar para liberar memoria del navegador
    URL.revokeObjectURL(this.data.url);
    this.dialogRef.close();
  }
}
