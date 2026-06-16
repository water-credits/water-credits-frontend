export enum UserRole {
  FARMER = 'farmer',
  VERIFIER = 'verifier',
  ADMIN = 'admin',
  BUYER = 'buyer',
}

export interface User {
  id: string;
  wallet: string;
  email?: string;
  displayName?: string;
  role: UserRole;
  isKycVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
