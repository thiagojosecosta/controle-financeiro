// ARQUIVO: src/app/services/theme.service.ts

import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';
  private isBrowser: boolean;

  readonly theme = signal<Theme>('light');

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      // Sincroniza com o que o script inline do index.html já aplicou
      // antes da primeira renderização (evita "flash" de tema errado).
      const current = document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light';
      this.theme.set(current);
    }
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.theme.set(theme);
    if (!this.isBrowser) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(this.STORAGE_KEY, theme);
  }
}
