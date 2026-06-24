import React from 'react';
import { useVaultStore } from '../../store/vaultStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

export const ConfirmationModal: React.FC = () => {
  const { confirmState, closeConfirm } = useVaultStore();

  if (!confirmState || !confirmState.isOpen) return null;

  const handleConfirm = () => {
    if (confirmState.onConfirm) {
      confirmState.onConfirm();
    }
    closeConfirm();
  };

  return (
    <AnimatePresence>
      <div 
        id="confirmation-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          id="confirmation-modal"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm glass-panel p-6 relative border border-white/10 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={closeConfirm}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>

          {/* Icon and Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {confirmState.title || 'Are you sure?'}
            </h3>
          </div>

          {/* Message */}
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            {confirmState.message}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={closeConfirm}
              className="w-1/2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-xl py-2.5 text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="w-1/2 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl py-2.5 text-xs transition-all cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default ConfirmationModal;
