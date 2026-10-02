import React from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useDayFlow } from '../context/DayFlowContext';

const toastConfig = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    containerClass: 'bg-[#111827] border-slate-700/60',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-400',
    containerClass: 'bg-red-950 border-red-800/60',
  },
  info: {
    icon: Info,
    iconClass: 'text-indigo-400',
    containerClass: 'bg-indigo-950 border-indigo-700/60',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-400',
    containerClass: 'bg-amber-950 border-amber-700/60',
  },
};

export const Toast: React.FC = () => {
  const { toastMessage, toastType } = useDayFlow();

  if (!toastMessage) return null;

  const config = toastConfig[toastType] || toastConfig.success;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-4 sm:left-auto right-4 sm:right-6 z-50 animate-toast-slide-up pointer-events-none flex justify-center sm:justify-end"
    >
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-xl border max-w-sm ${config.containerClass}`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${config.iconClass}`} />
        <span className="break-words">{toastMessage}</span>
      </div>
    </div>
  );
};
