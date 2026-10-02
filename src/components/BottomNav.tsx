import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  CheckCircle2,
  Plus,
  Repeat,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  Settings,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useDayFlow } from '../context/DayFlowContext';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/userHelpers';

export const BottomNav: React.FC = () => {
  const { openAddTaskModal, settings } = useDayFlow();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const displayName = user?.full_name || settings.name || 'User';
  const displayRole = user?.role || settings.role || 'Student / Developer';

  // Highlight "More" if currently on one of the secondary routes
  const isMoreRouteActive =
    ['/calendar', '/progress', '/settings'].includes(location.pathname) || isMoreOpen;

  // Close sheet on route change
  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  // Handle ESC key to dismiss sheet
  useEffect(() => {
    if (!isMoreOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen]);

  const moreNavItems = [
    {
      to: '/calendar',
      label: 'Calendar',
      description: 'Monthly schedule & date inspector',
      icon: Calendar,
      colorClass: 'bg-indigo-50 text-indigo-600',
    },
    {
      to: '/progress',
      label: 'Progress',
      description: 'Analytics, streak & productivity trends',
      icon: TrendingUp,
      colorClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      to: '/settings',
      label: 'Settings',
      description: 'Profile preferences & data management',
      icon: Settings,
      colorClass: 'bg-slate-100 text-slate-700',
    },
  ];

  return (
    <>
      {/* Mobile "More" Drawer / Action Sheet */}
      {isMoreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More Navigation Options"
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMoreOpen(false);
          }}
        >
          <div className="bg-white rounded-t-3xl border-t border-[#E5E7EB] shadow-2xl p-5 max-h-[85vh] overflow-y-auto pb-[calc(2rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header with User Info */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs tracking-wider">
                  {getInitials(displayName)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-[#111827] truncate">
                    {displayName}
                  </span>
                  <span className="text-xs text-[#6B7280] truncate font-medium">
                    {displayRole}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                aria-label="Close navigation sheet"
                className="p-2 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Links */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider px-1">
                Workspace Sections
              </span>
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all min-h-[52px] ${
                      isActive
                        ? 'bg-indigo-50/80 border-indigo-200 text-indigo-700 shadow-2xs font-semibold'
                        : 'bg-white border-[#E5E7EB] hover:bg-slate-50 text-[#111827]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold leading-tight">{item.label}</span>
                        <span className="text-[11px] text-[#6B7280] leading-tight mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  </NavLink>
                );
              })}
            </div>

            {/* Sign Out Option */}
            <div className="pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={async () => {
                  setIsMoreOpen(false);
                  await logout();
                  navigate('/login');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold text-xs hover:bg-red-100 transition-colors cursor-pointer min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] z-40 lg:hidden flex items-center justify-around px-2 shadow-lg select-none"
      >
        <NavLink
          to="/"
          end
          aria-label="Dashboard"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center min-w-[48px] h-full text-xs font-medium transition-colors ${
              isActive ? 'text-indigo-600 font-bold' : 'text-[#6B7280] hover:text-[#111827]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-indigo-600" />
              )}
              <LayoutGrid className="w-5 h-5 mb-0.5" />
              <span>Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/tasks"
          aria-label="My Tasks"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center min-w-[48px] h-full text-xs font-medium transition-colors ${
              isActive ? 'text-indigo-600 font-bold' : 'text-[#6B7280] hover:text-[#111827]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-indigo-600" />
              )}
              <CheckCircle2 className="w-5 h-5 mb-0.5" />
              <span>Tasks</span>
            </>
          )}
        </NavLink>

        {/* Floating Center + Action */}
        <button
          type="button"
          onClick={() => openAddTaskModal()}
          aria-label="Add Task"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700 active:scale-90 transition-all -mt-4 ring-4 ring-indigo-50 cursor-pointer"
        >
          <Plus className="w-6 h-6" />
        </button>

        <NavLink
          to="/routine"
          aria-label="Routine"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center min-w-[48px] h-full text-xs font-medium transition-colors ${
              isActive ? 'text-indigo-600 font-bold' : 'text-[#6B7280] hover:text-[#111827]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-indigo-600" />
              )}
              <Repeat className="w-5 h-5 mb-0.5" />
              <span>Routine</span>
            </>
          )}
        </NavLink>

        {/* "More" Trigger Button */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          aria-label="More navigation options"
          aria-expanded={isMoreOpen}
          className={`relative flex flex-col items-center justify-center min-w-[48px] h-full text-xs font-medium transition-colors cursor-pointer ${
            isMoreRouteActive ? 'text-indigo-600 font-bold' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          {isMoreRouteActive && (
            <span className="absolute top-0 w-8 h-0.5 rounded-full bg-indigo-600" />
          )}
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};

