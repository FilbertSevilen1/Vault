export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id?: number;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  notes: string;
  paymentMethod?: string; // Optional for income, required for expenses
}

export type AssetType = 'Stocks' | 'ETFs' | 'Crypto' | 'Real Estate' | 'Gold' | 'Savings' | 'Other';

export interface Investment {
  id?: number;
  assetName: string;
  assetType: AssetType;
  quantity: number;
  buyPrice: number;
  currentValue: number;
  purchaseDate: string; // YYYY-MM-DD
  notes: string;
}

export interface Goal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  notes: string;
}

export interface Settings {
  currency: string;
  theme: 'dark' | 'carbon' | 'light';
  username: string;
  onboardingCompleted: boolean;
}
