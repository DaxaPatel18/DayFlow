import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar as CalendarIcon, Plus, Bell, Check, Sparkles } from 'lucide-react';
import { useDayFlow } from '../context/DayFlowContext';
import { formatFullDate } from '../utils/dateHelpers';
import { DayFlowLogo } from './DayFlowLogo';
import { useAuth } from '../context/AuthContext';
import { getInitials, getTimeGreeting } from '../utils/userHelpers';

export const Header: React.FC = () => {
  const { settings, todayDate, openAddTaskModal, setIsSearchOpen, tasks, stats, isDemoData, clearDemoData } = useDayFlow();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const displayName = user?.full_name || settings.name || 'User';
  // Use first name only for greeting to keep it tight
  const firstName = displayName.split(' ')[0];

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  const recentCompleted = tasks.filter((t) => t.completed).slice(0, 3);

  // Format date nicely
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = formatFullDate(todayDate);

  return (
    <header className="fixed top-0 left-0 lg:left-60 right-0 h-16 bg-white/97 backdrop-blur-md border-b border-[#E5E7EB] z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all">
      {/* Left: Mobile Brand / Desktop Greeting */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile: Logo + brand name */}
        <div className="lg:hidden flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate('/')}>
          <DayFlowLogo size={26} />
          <span className="font-bold text-base text-[#111827] tracking-tight">DayFlow</span>
        </div>

        {/* Desktop: Greeting */}
        <div className="hidden lg:flex flex-col min-w-0">
          <h1 className="text-base font-bold text-[#111827] leading-tight flex items-center gap-1.5 truncate">
            {getTimeGreeting()}, {firstName} <span className="text-base">👋</span>
          </h1>
          <p className="text-[11px] text-[#6B7280] leading-tight mt-0.5 truncate">
            {dayName} · {dateStr}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Demo Workspace Indicator */}
        {isDemoData && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="hidden sm:inline">Demo workspace</span>
            <button
              type="button"
              onClick={clearDemoData}
              className="text-amber-700 hover:text-amber-900 underline font-medium text-[11px] ml-1 cursor-pointer"
              title="Clear sample demonstration data"
            >
              Clear
            </button>
          </div>
        )}

        {/* Quick Search */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Quick search (Ctrl+K)"
          className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] hover:border-indigo-300 hover:bg-indigo-50/30 p-2 md:px-3 md:py-1.5 rounded-xl text-[#6B7280] hover:text-indigo-600 text-xs transition-all cursor-pointer"
        >
          <Search className="w-4 h-4 text-[#9CA3AF]" />
          <span className="hidden md:inline font-medium text-[#6B7280]">Search...</span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-[#4B5563] text-[10px] font-mono border border-[#E5E7EB]">
            ⌘K
          </kbd>
        </button>

        {/* New Task Button (Desktop/Tablet) */}
        <button
          type="button"
          onClick={() => openAddTaskModal()}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-sm shadow-indigo-200 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="whitespace-nowrap">New Task</span>
        </button>

        {/* Notification Icon & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            aria-expanded={showNotifications}
            className="relative p-2 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {stats.completedToday > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-76 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-[#E5E7EB] shadow-xl p-4 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-bold text-[#111827]">Today's Activity</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600">
                  {stats.productivityPct}% done
                </span>
              </div>

              <div className="py-2 flex flex-col gap-2">
                <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
                  <span className="text-[#4B5563]">Completed today</span>
                  <span className="font-bold text-indigo-700">
                    {stats.completedToday} of {stats.totalTasksToday}
                  </span>
                </div>

                {/* Animated progress */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 progress-bar-fill transition-all duration-500"
                    style={{ width: `${stats.productivityPct}%` }}
                  />
                </div>

                {recentCompleted.length > 0 ? (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Recent wins</span>
                    {recentCompleted.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-[#E5E7EB] text-xs text-[#374151]"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#9CA3AF] py-2 text-center">
                    Complete tasks to see your wins here!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Button */}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label="User Profile & Settings"
          title={`Settings for ${displayName}`}
          className="p-0.5 rounded-full ring-2 ring-transparent hover:ring-indigo-300 transition-all cursor-pointer"
        >
          {settings.avatarUrl && settings.avatarUrl.startsWith('http') && !settings.avatarUrl.includes('ui-avatars.com') ? (
            <img
              src={settings.avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm tracking-wider">
              {getInitials(displayName)}
            </div>
          )}
        </button>
      </div>
    </header>
  );
};
