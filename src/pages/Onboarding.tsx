import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVaultStore, CURRENCY_SYMBOLS } from '../store/vaultStore';
import { seedMockData } from '../utils/mockData';
import { Shield, Sparkles, TrendingUp, KeyRound, ArrowRight } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [includeMockData, setIncludeMockData] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const { setUsername, setCurrency, setOnboardingCompleted } = useVaultStore();

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    setStep((prev) => prev + 1);
  };

  const handleFinish = async () => {
    setIsSeeding(true);
    try {
      setUsername(name.trim());
      setCurrency(selectedCurrency);
      
      if (includeMockData) {
        await seedMockData();
      }
      
      setOnboardingCompleted(true);
    } catch (error) {
      console.error('Error during onboarding:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="min-h-screen bg-grid-overlay relative flex items-center justify-center p-4">
      {/* Decorative gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-lg glass-panel p-8 md:p-10 relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                <Shield size={24} />
              </div>
              <span className="text-sm font-semibold tracking-wider uppercase text-violet-400">Vault</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 text-left">
              Privacy-first <br />
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                personal wealth vault.
              </span>
            </h1>

            <p className="text-zinc-400 text-sm md:text-base mb-8 leading-relaxed text-left">
              Welcome to Vault. All financial transactions, portfolios, and goals are stored exclusively inside your browser's local database. No servers, no accounts, and absolutely zero tracking.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 rounded-lg bg-zinc-800 text-zinc-300">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">100% Offline-Capable</h4>
                  <p className="text-xs text-zinc-500">Your data never leaves this device. Access your vault anytime, anywhere.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 rounded-lg bg-zinc-800 text-zinc-300">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Modern Aesthetic & UI</h4>
                  <p className="text-xs text-zinc-500">Fluid layouts, keyboard shortcuts, and intelligent insights engine.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name-input" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block text-left">
                What should we call you?
              </label>
              <input
                id="name-input"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium"
                autoFocus
              />
            </div>

            <button
              onClick={handleNext}
              disabled={!name.trim()}
              className="mt-8 w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set up your Vault
              <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-lg glass-panel p-8 md:p-10 relative overflow-hidden"
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2 text-left">
              Select your currency
            </h2>
            <p className="text-zinc-400 text-sm mb-6 text-left">
              This will be used as the default currency symbol across your financial dashboards, graphs, and portfolios.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {Object.keys(CURRENCY_SYMBOLS).map((code) => (
                <button
                  key={code}
                  onClick={() => setSelectedCurrency(code)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedCurrency === code
                      ? 'bg-violet-500/10 border-violet-500 text-white font-semibold'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="text-xl mb-1">{CURRENCY_SYMBOLS[code]}</span>
                  <span className="text-xs uppercase tracking-wider">{code}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center gap-4">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-medium rounded-xl py-3 cursor-pointer transition-all"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="w-2/3 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-lg glass-panel p-8 md:p-10 relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <TrendingUp size={24} />
              </div>
              <span className="text-sm font-semibold tracking-wider uppercase text-emerald-400">Ready</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2 text-left">
              Finalizing details
            </h2>
            <p className="text-zinc-400 text-sm mb-6 text-left">
              Would you like to seed your vault with realistic mock data? This allows you to explore the dashboard trends immediately without manual entry.
            </p>

            <div
              onClick={() => setIncludeMockData(!includeMockData)}
              className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all mb-8 ${
                includeMockData
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
                includeMockData ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700'
              }`}>
                {includeMockData && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-white">Pre-populate Demo Accounts</h4>
                <p className="text-xs text-zinc-500">Includes 12 months of transactions, investment funds, and active goals.</p>
              </div>
            </div>

            <div className="flex justify-between items-center gap-4">
              <button
                onClick={() => setStep(2)}
                disabled={isSeeding}
                className="w-1/3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-medium rounded-xl py-3 cursor-pointer transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={isSeeding}
                className="w-2/3 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSeeding ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Building Vault...
                  </>
                ) : (
                  <>
                    Unlock your Vault
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
