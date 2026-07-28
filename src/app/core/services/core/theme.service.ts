import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'data-app-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly themeSignal = signal<ThemeMode>(this.obtenerThemeInicial());

  readonly theme = this.themeSignal.asReadonly();

  constructor() {
    this.aplicarTheme(this.themeSignal());
  }

  toggleTheme(): void {
    this.setTheme(this.themeSignal() === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: ThemeMode): void {
    this.themeSignal.set(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    this.aplicarTheme(theme);
  }

  private aplicarTheme(theme: ThemeMode): void {
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }

  private obtenerThemeInicial(): ThemeMode {
    const guardado = localStorage.getItem(THEME_STORAGE_KEY);
    return guardado === 'dark' ? 'dark' : 'light';
  }
}
