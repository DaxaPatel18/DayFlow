import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useDayFlow } from '../context/DayFlowContext';

export const ConfirmModal: React.FC = () => {
  const { confirmModal, closeConfirmModal } = useDayFlow();

  // Handle ESC key to close modal
  React.useEffect(() => {
    if (!confirmModal || !confirmModal.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeConfirmModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal, closeConfirmModal]);

  if (!confirmModal || !confirmModal.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeConfirmModal();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl p-5 sm:p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmModal.isDanger !== false
                  ? 'bg-red-50 text-red-600 border border-red-100'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#111827]">{confirmModal.title}</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">{confirmModal.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeConfirmModal}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={closeConfirmModal}
            className="flex items-center justify-center h-10 sm:h-11 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#111827] font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              confirmModal.onConfirm();
              closeConfirmModal();
            }}
            className={`flex items-center justify-center h-10 sm:h-11 px-4 rounded-xl text-white font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer ${
              confirmModal.isDanger !== false
                ? 'bg-red-600 hover:bg-red-700 active:scale-95'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {confirmModal.confirmButtonText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
