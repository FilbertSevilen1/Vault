import Dexie, { type Table } from 'dexie';
import type { Transaction, Investment, Goal } from '../types';

class VaultDatabase extends Dexie {
  transactions!: Table<Transaction>;
  investments!: Table<Investment>;
  goals!: Table<Goal>;

  constructor() {
    super('VaultDatabase');
    this.version(1).stores({
      transactions: '++id, type, amount, category, date, paymentMethod',
      investments: '++id, assetName, assetType, purchaseDate',
      goals: '++id, name, targetAmount, deadline'
    });
  }
}

export const db = new VaultDatabase();
export default db;
