import React, { useState, useEffect, useRef } from 'react';
import { useVaultStore } from '../../store/vaultStore';
import { 
  Search, 
  Sparkles, 
  ArrowRight,
  Database,
  Palette,
  DollarSign,
  Monitor
} from 'lucide-react';

interface CommandItem {
  id: string;
  category: string;
  label: string;
  shortcut?: string;
  action: () => void;
  icon: React.ComponentType<any>;
}

export const CommandPalette: React.FC = () => {
  const { 
    commandPaletteOpen, 
    setCommandPaletteOpen, 
    setActiveTab, 
    setQuickAddOpen, 
    setTheme, 
    setCurrency, 
    resetAll,
    showConfirm
  } = useVaultStore();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global Key Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      
      // Close on Escape
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  // Focus Input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dash', category: 'Navigation', label: 'Go to Dashboard (Overview)', shortcut: 'G + D', icon: Monitor, action: () => setActiveTab('dashboard') },
    { id: 'nav-trans', category: 'Navigation', label: 'Go to Transactions Ledger', shortcut: 'G + T', icon: Monitor, action: () => setActiveTab('transactions') },
    { id: 'nav-inv', category: 'Navigation', label: 'Go to Investments Portfolio', shortcut: 'G + I', icon: Monitor, action: () => setActiveTab('investments') },
    { id: 'nav-goals', category: 'Navigation', label: 'Go to Savings Targets', shortcut: 'G + G', icon: Monitor, action: () => setActiveTab('goals') },
    { id: 'nav-anal', category: 'Navigation', label: 'Go to Deep Analytics', shortcut: 'G + A', icon: Monitor, action: () => setActiveTab('analytics') },
    { id: 'nav-sett', category: 'Navigation', label: 'Go to Settings', shortcut: 'G + S', icon: Monitor, action: () => setActiveTab('settings') },
    
    // Quick actions
    { id: 'act-add', category: 'Quick Actions', label: 'Add New Transaction...', shortcut: 'N', icon: Sparkles, action: () => { setQuickAddOpen(true); } },
    
    // Theme selection
    { id: 'theme-dark', category: 'Appearance', label: 'Switch to Obsidian Dark', icon: Palette, action: () => setTheme('dark') },
    { id: 'theme-carbon', category: 'Appearance', label: 'Switch to Carbon Black', icon: Palette, action: () => setTheme('carbon') },
    { id: 'theme-light', category: 'Appearance', label: 'Switch to Clean Light', icon: Palette, action: () => setTheme('light') },
    
    // Currency selection
    { id: 'curr-usd', category: 'Currency', label: 'Set currency to USD ($)', icon: DollarSign, action: () => setCurrency('USD') },
    { id: 'curr-eur', category: 'Currency', label: 'Set currency to EUR (€)', icon: DollarSign, action: () => setCurrency('EUR') },
    { id: 'curr-gbp', category: 'Currency', label: 'Set currency to GBP (£)', icon: DollarSign, action: () => setCurrency('GBP') },
    { id: 'curr-jpy', category: 'Currency', label: 'Set currency to JPY (¥)', icon: DollarSign, action: () => setCurrency('JPY') },
    { id: 'curr-idr', category: 'Currency', label: 'Set currency to IDR (Rp)', icon: DollarSign, action: () => setCurrency('IDR') },
    
    // Data operations
    { id: 'data-reset', category: 'System', label: 'Reset All Local Data', icon: Database, action: () => { showConfirm('Reset All Local Data', 'Are you sure you want to wipe all local data? This is irreversible.', resetAll); } },
  ];

  // Filtering commands
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) || 
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Navigate using Keyboard arrows
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setCommandPaletteOpen(false);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const listElement = listRef.current;
    if (listElement) {
      const activeChild = listElement.children[selectedIndex] as HTMLElement;
      if (activeChild) {
        const listHeight = listElement.clientHeight;
        const activeTop = activeChild.offsetTop;
        const activeHeight = activeChild.clientHeight;
        
        if (activeTop + activeHeight > listElement.scrollTop + listHeight) {
          listElement.scrollTop = activeTop + activeHeight - listHeight;
        } else if (activeTop < listElement.scrollTop) {
          listElement.scrollTop = activeTop;
        }
      }
    }
  }, [selectedIndex]);

  if (!commandPaletteOpen) return null;

  return (
    <div 
      id="command-palette-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div 
        id="command-palette-modal"
        className="w-full max-w-xl glass-panel border border-white/10 shadow-2xl overflow-hidden flex flex-col scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-zinc-950/20">
          <Search size={18} className="text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-0 text-white placeholder-zinc-600 focus:outline-none focus:ring-0 text-sm font-medium"
          />
          <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-500 font-mono">
            ESC
          </span>
        </div>

        {/* Action List */}
        <div 
          ref={listRef}
          className="max-h-80 overflow-y-auto py-2 bg-zinc-950/10"
        >
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === selectedIndex;
              
              return (
                <button
                  key={cmd.id}
                  onClick={() => { cmd.action(); setCommandPaletteOpen(false); }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-5 py-3 transition-colors text-left cursor-pointer ${
                    isSelected ? 'bg-white/[0.04]' : 'bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isSelected ? 'text-violet-400' : 'text-zinc-500'} />
                    <div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                        {cmd.label}
                      </span>
                      <span className="text-[10px] text-zinc-600 ml-2.5 font-semibold tracking-wider uppercase bg-zinc-900/40 px-1.5 py-0.5 rounded border border-white/5">
                        {cmd.category}
                      </span>
                    </div>
                  </div>
                  
                  {cmd.shortcut ? (
                    <span className="text-[10px] text-zinc-500 font-semibold font-mono tracking-wider">
                      {cmd.shortcut}
                    </span>
                  ) : isSelected ? (
                    <ArrowRight size={14} className="text-zinc-500 animate-pulse" />
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="px-5 py-8 text-center text-zinc-500 text-sm">
              No command results found for "{search}"
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/5 bg-zinc-950/40 text-[10px] text-zinc-500 font-medium">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <div>
            <span>Press Cmd+K to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
