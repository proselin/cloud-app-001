import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'preferred-theme';

  // Signal for reactive theme state
  currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Effect to apply theme changes to document
    effect(() => {
      this.applyTheme(this.currentTheme());
    });
  }

  private getInitialTheme(): Theme {
    // Check localStorage first
    const stored = localStorage.getItem(this.THEME_STORAGE_KEY) as Theme;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    // Remove existing theme classes (both old CSS variable based and new Tailwind dark class)
    root.classList.remove('light-theme', 'dark-theme', 'dark');

    // Add Tailwind's dark mode class for dark theme
    // Add Tailwind's dark mode class for dark theme
    if (theme === 'dark') {
      root.classList.add('dark');
    }

    // Store preference
    localStorage.setItem(this.THEME_STORAGE_KEY, theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f0f0f' : '#ffffff');
    }
  }

  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }

  isLight(): boolean {
    return this.currentTheme() === 'light';
  }
}
