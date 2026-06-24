import React from 'react';
import { useVaultStore } from '../../store/vaultStore';
import type { TabType } from '../../store/vaultStore';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Settings as SettingsIcon,
  Shield,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, username } = useVaultStore();

  const menuItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as TabType, label: 'Transactions', icon: ArrowLeftRight },
    { id: 'investments' as TabType, label: 'Investments', icon: TrendingUp },
    { id: 'goals' as TabType, label: 'Goals', icon: Target },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as TabType, label: 'Settings', icon: SettingsIcon },
  ];

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-zinc-950/80 md:bg-zinc-950/40 border-r border-white/5 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Shield size={20} className="animate-pulse" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Vault
            </span>
          </div>
          <button 
            onClick={() => setMobileOpen(false)} 
            className="p-1 text-zinc-400 hover:text-white md:hidden hover:bg-white/5 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 group cursor-pointer ${
                  isActive 
                    ? 'text-white' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-glow"
                    className="absolute inset-0 bg-white/[0.03] border border-white/10 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="active-tab-bar"
                    className="absolute left-0 top-3 bottom-3 w-1 bg-violet-500 rounded-r-md"
                    initial={false}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={18} className={`relative z-10 transition-transform group-hover:scale-105 ${isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-white/5 bg-zinc-950/20">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-violet-500/20">
              {username ? username.charAt(0).toUpperCase() : 'V'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {username || 'Vault User'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
