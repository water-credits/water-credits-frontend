export interface CreditBalance {
  projectId: string;
  projectName: string;
  balance: string;
  totalMinted: string;
  totalRetired: string;
  creditPrice: number;
}

export interface CreditTransaction {
  id: string;
  projectId: string;
  type: 'mint' | 'retire' | 'transfer' | 'sale';
  amount: string;
  from?: string;
  to?: string;
  txHash: string;
  timestamp: string;
}

export interface CreditPortfolio {
  totalBalance: string;
  totalValue: number;
  holdings: CreditBalance[];
  recentTransactions: CreditTransaction[];
}
