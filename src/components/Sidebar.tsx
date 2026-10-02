import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  CheckCircle2,
  Repeat,
  Calendar,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react';
import { DayFlowLogo } from './DayFlowLogo';
import { useDayFlow } from '../context/DayFlowContext';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/userHelpers';

export const Sidebar: React.FC = () => {
  const { tasks, routines, settings, todayDate } = useDayFlow();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active uncompleted tasks for today + upcoming
  const pendingTasksCount = tasks.filter((t) => !t.completed && t.date >= todayDate).length;
  const activeRoutinesCount = routines.filter((r) => r.enabled).length;

  const displayName = user?.full_name || settings.name || 'User';
  const displayRole = user?.role || settings.role || 'Student / Developer';

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      to: '/tasks',
      label: 'My Tasks',
      icon: CheckCircle2,
      badge: pendingTasksCount,
    },
    {
      to: '/routine',
      label: 'Routine',
      icon: Repeat,
      badge: activeRoutinesCount,
    },
    {
      to: '/calendar',
      label: 'Calendar',
      icon: Calendar,
    },
    {
      to: '/progress',
      label: 'Progress',
      icon: TrendingUp,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-[#E5E7EB] z-50 hidden lg:flex flex-col justify-between select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#E5E7EB]/60">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <DayFlowLogo size={32} />
            <span className="font-bold text-lg text-[#111827] tracking-tight group-hover:text-indigo-600 transition-colors">
              DayFlow
            </span>
          </NavLink>
          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-bold text-[10px] tracking-widest uppercase border border-indigo-200/60">
            PRO
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-0.5 px-2 mt-4" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all relative overflow-hidden ${
                    isActive
                      ? 'sidebar-nav-active bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-[#4B5563] hover:bg-slate-50 hover:text-[#111827]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="px-4 mb-2">
        <div className="h-px bg-[#E5E7EB]" />
      </div>

      {/* User Footer Profile Card */}
      <div className="p-3 mx-3 mb-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl flex items-center justify-between gap-1 shadow-sm hover:border-indigo-200 transition-colors">
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2.5 overflow-hidden cursor-pointer group flex-1 min-w-0"
          title="Account Settings"
        >
          {/* Avatar with initials or custom photo */}
          {settings.avatarUrl && settings.avatarUrl.startsWith('http') && !settings.avatarUrl.includes('ui-avatars.com') ? (
            <img
              src={settings.avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm group-hover:ring-indigo-200 transition-all"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-white shadow-sm group-hover:ring-indigo-200 transition-all tracking-wider">
              {getInitials(displayName)}
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-[#111827] truncate group-hover:text-indigo-600 transition-colors">
              {displayName}
            </span>
            <span className="text-[11px] text-[#6B7280] truncate font-medium">
              {displayRole}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          aria-label="Sign Out"
          title="Sign Out"
          className="p-1.5 text-[#9CA3AF] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
