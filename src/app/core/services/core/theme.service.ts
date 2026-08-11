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

  // Re-aplica al <body> la preferencia ya guardada, sin tocar el storage.
  // Lo usa el login para restaurar el tema real del usuario al salir de esa
  // pantalla (que siempre se ve en claro, ver aplicarThemeClaroForzado).
  aplicarThemeActual(): void {
    this.aplicarTheme(this.themeSignal());
  }

  // El login siempre se ve en claro por estetica, sin importar la preferencia
  // guardada - esto NO cambia el storage ni el signal, solo la clase del DOM
  // mientras se esta en esa pantalla.
  aplicarThemeClaroForzado(): void {
    document.body.classList.remove('dark-theme');
  }

  private aplicarTheme(theme: ThemeMode): void {
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }

  private obtenerThemeInicial(): ThemeMode {
    const guardado = localStorage.getItem(THEME_STORAGE_KEY);
    return guardado === 'dark' ? 'dark' : 'light';
  }
}
