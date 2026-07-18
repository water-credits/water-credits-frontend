import { createReducer, on } from '@ngrx/store';
import * as UIActions from './ui.actions';

export interface UIState {
  sidebarOpen: boolean;
  isDarkMode: boolean;
  isLoading: boolean;
}

export const initialState: UIState = {
  sidebarOpen: true,
  isDarkMode: true, // Default to dark mode
  isLoading: false,
};

export const uiReducer = createReducer(
  initialState,
  on(UIActions.toggleSidebar, (state) => ({ ...state, sidebarOpen: !state.sidebarOpen })),
  on(UIActions.setDarkMode, (state, { isDark }) => ({ ...state, isDarkMode: isDark })),
  on(UIActions.setLoading, (state, { isLoading }) => ({ ...state, isLoading })),
);
