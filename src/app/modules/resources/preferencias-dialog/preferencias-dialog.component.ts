import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from 'src/app/core/services/core/theme.service';

@Component({
  selector: 'preferencias-dialog',
  imports: [MatDialogModule, MatSlideToggleModule, MatIconModule],
  templateUrl: './preferencias-dialog.component.html',
  styleUrl: './preferencias-dialog.component.scss'
})
export class PreferenciasDialogComponent {

  constructor(protected themeService: ThemeService) { }

  cambiarTemaOscuro(activo: boolean): void {
    this.themeService.setTheme(activo ? 'dark' : 'light');
  }
}
