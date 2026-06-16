export interface AnalyticsOverview {
  totalProjects: number;
  activeProjects: number;
  totalCreditsMinted: string;
  totalCreditsRetired: string;
  totalRetirements: number;
  totalUsers: number;
  verifiedOracles: number;
}

export interface CreditsOverTimePoint {
  date: string;
  minted: number;
  retired: number;
}

export interface ProjectDistribution {
  status: string;
  count: number;
}

export interface RetirementByPurpose {
  purpose: string;
  amount: string;
  percentage: number;
}

export interface TopProject {
  id: string;
  name: string;
  totalMinted: string;
  totalRetired: string;
}

export interface TopRetiree {
  id: string;
  name: string;
  totalRetired: string;
  count: number;
}
