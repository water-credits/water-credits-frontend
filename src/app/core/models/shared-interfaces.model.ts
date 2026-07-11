import { Type } from '@angular/core';

export interface NavItem {
  label: string;
  route: string;
  icon: Type<unknown>;
  roles?: string[];
}

export interface FormStep {
  label: string;
  icon: Type<unknown>;
  description: string;
}

export interface ParameterConfig {
  key: string;
  label: string;
  unit: string;
  icon: Type<unknown>;
  color: string;
  decimals: number;
}

export interface AlertThreshold {
  key: string;
  label: string;
  unit: string;
  enabled: boolean;
  min: number;
  max: number;
  warningMin: number;
  warningMax: number;
}
