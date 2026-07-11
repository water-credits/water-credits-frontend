import { createAction, props } from '@ngrx/store';
import { User } from '../../models/user.model';

export const login = createAction('[Auth] Login');
export const loginSuccess = createAction('[Auth] Login Success', props<{ user: User; token: string }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());

export const logout = createAction('[Auth] Logout');

export const getCurrentUser = createAction('[Auth] Get Current User');
export const getCurrentUserSuccess = createAction('[Auth] Get Current User Success', props<{ user: User }>());
export const getCurrentUserFailure = createAction('[Auth] Get Current User Failure', props<{ error: string }>());
