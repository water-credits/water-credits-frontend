import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import { setDarkMode } from '../store/ui/ui.actions';
import { selectIsDarkMode } from '../store/ui/ui.selectors';

/** Key used to persist the user's theme preference in localStorage. */
const THEME_STORAGE_KEY = 'theme';

/**
 * ThemeService
 *
 * Single source of truth for theme management. Responsibilities:
 *  1. Read the persisted preference from localStorage on app init and
 *     seed the NgRx store so the UI reflects the saved state.
 *  2. React to store changes: add/remove the `dark` class on <html> and
 *     write the preference back to localStorage so it survives page refresh.
 *
 * The matching inline script in index.html applies the `dark` class
 * synchronously *before* Angular boots, eliminating the flash of wrong theme
 * (FOUC). This service then keeps the DOM class in sync with the store as the
 * user interacts with the toggle.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly store = inject(Store<AppState>);

  /**
   * Call once from AppComponent.ngOnInit().
   *
   * Reads the stored preference and dispatches setDarkMode so the store and
   * DOM are aligned. Then subscribes to future store changes to keep both
   * localStorage and the <html> class up to date.
   */
  initialize(): void {
    // Seed the store from localStorage so toggles in the header reflect the
    // persisted value rather than the reducer's hard-coded default.
    const stored = this.readStoredPreference();
    this.store.dispatch(setDarkMode({ isDark: stored }));

    // Keep the DOM class and localStorage in sync whenever the store changes.
    this.store.select(selectIsDarkMode).subscribe((isDark) => {
      this.applyTheme(isDark);
    });
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Reads the stored theme preference.
   * Defaults to `true` (dark) when no preference has been saved yet,
   * which matches the reducer's `initialState.isDarkMode = true`.
   */
  private readStoredPreference(): boolean {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return stored !== null ? stored === 'dark' : true;
    } catch {
      // localStorage unavailable (e.g. private browsing with strict settings)
      return true;
    }
  }

  /**
   * Applies `isDark` to the DOM and persists it.
   * The inline script in index.html already did this for the initial load,
   * so this mainly handles subsequent toggle events.
   */
  private applyTheme(isDark: boolean): void {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Silently ignore if localStorage is unavailable.
    }
  }
}
