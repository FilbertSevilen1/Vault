import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import db from '../db/vaultDb';

export type TabType = 'dashboard' | 'transactions' | 'investments' | 'goals' | 'analytics' | 'settings';

export interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => void | Promise<void>) | null;
}

export interface VaultState {
  activeTab: TabType;
  commandPaletteOpen: boolean;
  quickAddOpen: boolean;
  currency: string; // e.g. 'USD', 'EUR', 'GBP'
  theme: 'dark' | 'carbon' | 'light';
  username: string;
  onboardingCompleted: boolean;
  confirmState: ConfirmState;
  
  setActiveTab: (tab: TabType) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickAddOpen: (open: boolean) => void;
  setCurrency: (currency: string) => void;
  setTheme: (theme: 'dark' | 'carbon' | 'light') => void;
  setUsername: (username: string) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void | Promise<void>) => void;
  closeConfirm: () => void;
  resetAll: () => Promise<void>;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  INR: '₹',
  CNY: '¥',
  IDR: 'Rp',
};

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      activeTab: 'dashboard',
      commandPaletteOpen: false,
      quickAddOpen: false,
      currency: 'USD',
      theme: 'dark',
      username: '',
      onboardingCompleted: false,
      confirmState: {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setQuickAddOpen: (open) => set({ quickAddOpen: open }),
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => {
        set({ theme });
        // Update document root class for theme styling
        const root = document.documentElement;
        root.classList.remove('theme-dark', 'theme-carbon', 'theme-light');
        root.classList.add(`theme-${theme}`);
      },
      setUsername: (username) => set({ username }),
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      showConfirm: (title, message, onConfirm) => set({
        confirmState: {
          isOpen: true,
          title,
          message,
          onConfirm
        }
      }),
      closeConfirm: () => set((state) => ({
        confirmState: {
          ...state.confirmState,
          isOpen: false
        }
      })),
      resetAll: async () => {
        // Clear Dexie database tables
        await Promise.all([
          db.transactions.clear(),
          db.investments.clear(),
          db.goals.clear(),
        ]);
        // Reset state values
        set({
          activeTab: 'dashboard',
          currency: 'USD',
          theme: 'dark',
          username: '',
          onboardingCompleted: false,
        });
        const root = document.documentElement;
        root.classList.remove('theme-carbon', 'theme-light');
        root.classList.add('theme-dark');
      },
    }),
    {
      name: 'vault-settings-storage',
      partialize: (state) => ({
        currency: state.currency,
        theme: state.theme,
        username: state.username,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);
