import { ActionReducerMap } from '@ngrx/store';
import { authReducer, AuthState } from './auth/auth.reducer';
import { walletReducer, WalletState } from './wallet/wallet.reducer';
import { uiReducer, UIState } from './ui/ui.reducer';
import { projectsReducer, ProjectsState } from './projects/projects.reducer';
import { sensorsReducer, SensorsState } from './sensors/sensors.reducer';
import { creditsReducer, CreditsState } from './credits/credits.reducer';
import { retirementReducer, RetirementState } from './retirement/retirement.reducer';

export interface AppState {
  auth: AuthState;
  wallet: WalletState;
  ui: UIState;
  projects: ProjectsState;
  sensors: SensorsState;
  credits: CreditsState;
  retirement: RetirementState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  wallet: walletReducer,
  ui: uiReducer,
  projects: projectsReducer,
  sensors: sensorsReducer,
  credits: creditsReducer,
  retirement: retirementReducer,
};
