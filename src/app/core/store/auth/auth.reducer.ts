import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { User } from '../../models/user.model';

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    loading: false,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(AuthActions.logout, (state) => ({
    ...state,
    user: null,
    token: null,
  })),
  on(AuthActions.getCurrentUser, (state) => ({ ...state, loading: true })),
  on(AuthActions.getCurrentUserSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
  })),
  on(AuthActions.getCurrentUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  }))
);
