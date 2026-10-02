import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Sliders,
  Sun,
  Trash2,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  LogOut,
  Mail,
  Fingerprint,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useDayFlow } from '../context/DayFlowContext';
import { useAuth } from '../context/AuthContext';
import { Category, Priority } from '../types';
import { getInitials } from '../utils/userHelpers';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    clearAllData,
    openConfirmModal,
    isDemoData,
    loadDemoData,
    clearDemoData,
  } = useDayFlow();
  const { user, logout, updateProfile, isMockAuth } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.full_name || settings.name || '');
  const [role, setRole] = useState(user?.role || settings.role || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || settings.avatarUrl || '');
  const [defaultCategory, setDefaultCategory] = useState<Category>(settings.defaultCategory);
  const [defaultPriority, setDefaultPriority] = useState<Priority>(settings.defaultPriority);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.full_name) setName(user.full_name);
    if (user?.role) setRole(user.role);
    if (user?.avatar_url) setAvatarUrl(user.avatar_url);
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const trimmedName = name.trim() || user?.full_name || 'User';
    const trimmedRole = role.trim() || user?.role || 'Student / Developer';
    const trimmedAvatar = avatarUrl.trim() || settings.avatarUrl;

    await updateSettings({
      name: trimmedName,
      role: trimmedRole,
      avatarUrl: trimmedAvatar,
      defaultCategory,
      defaultPriority,
    });

    await updateProfile({
      full_name: trimmedName,
      role: trimmedRole,
      avatar_url: trimmedAvatar,
    });

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleConfirmClearData = () => {
    openConfirmModal({
      title: 'Clear All Data?',
      message:
        'This will permanently delete all your tasks, routines, and completion history for your account. Are you sure?',
      confirmButtonText: 'Clear Everything',
      isDanger: true,
      onConfirm: () => {
        clearAllData();
      },
    });
  };

  const handleConfirmLoadDemo = () => {
    openConfirmModal({
      title: 'Explore with Sample Data?',
      message:
        'This will insert sample tasks and routines so you can explore how DayFlow works. You can clear this demo data anytime.',
      confirmButtonText: 'Load Demo Data',
      isDanger: false,
      onConfirm: () => {
        loadDemoData();
      },
    });
  };

  const handleConfirmClearDemo = () => {
    openConfirmModal({
      title: 'Clear Demo Data?',
      message:
        'This will remove all sample demo tasks, routines, and completion history from your workspace.',
      confirmButtonText: 'Clear Demo Data',
      isDanger: true,
      onConfirm: () => {
        clearDemoData();
      },
    });
  };

  const handleSignOut = () => {
    openConfirmModal({
      title: 'Sign Out?',
      message: 'Are you sure you want to end your DayFlow session?',
      confirmButtonText: 'Sign Out',
      isDanger: false,
      onConfirm: async () => {
        await logout();
        navigate('/login');
      },
    });
  };

  const avatarFallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || user?.full_name || 'User'
  )}&background=6366F1&color=fff`;

  return (
    <div className="flex flex-col gap-6 sm:gap-7 max-w-3xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">Settings</h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Customize your profile, preferences, and account settings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your profile and preferences have been updated immediately!</span>
        </div>
      )}

      {/* Account Info Card (Supabase Profile) */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-6 shadow-2xs flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Account &amp; Authentication</h2>
              <p className="text-xs text-[#6B7280]">Account details &amp; cloud sync status</p>
            </div>
          </div>
          <span
            className={`self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
              isMockAuth
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {isMockAuth ? 'Dev Mock Mode (Active)' : 'Cloud Sync Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3 sm:p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center gap-3">
            <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-[#6B7280] block font-medium">Email Address</span>
              <span className="text-xs font-bold text-[#111827] truncate block" title={user?.email}>
                {user?.email || 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center gap-3">
            <Fingerprint className="w-4 h-4 text-purple-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-[#6B7280] block font-medium">Account ID</span>
              <span className="text-xs font-mono font-bold text-[#111827] truncate block" title={user?.id}>
                {user?.id || 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center gap-3">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-[#6B7280] block font-medium">Member Since</span>
              <span className="text-xs font-bold text-[#111827] truncate block">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Today'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
        {/* Profile Section */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-6 shadow-2xs flex flex-col gap-4 sm:gap-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E7EB]">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Personal Profile</h2>
              <p className="text-xs text-[#6B7280]">
                Updating this immediately updates your greeting and sidebar
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            {avatarUrl && avatarUrl.startsWith('http') && !avatarUrl.includes('ui-avatars.com') ? (
              <img
                src={avatarUrl}
                alt="Avatar Preview"
                referrerPolicy="no-referrer"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-indigo-50 border border-[#E5E7EB] shadow-xs shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = avatarFallbackUrl;
                }}
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-xs ring-4 ring-indigo-50 tracking-wider shrink-0">
                {getInitials(name || user?.full_name || 'User')}
              </div>
            )}
            <div className="flex flex-col flex-1 w-full gap-1.5">
              <label className="text-xs font-semibold text-[#111827]">Avatar Image URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full h-10 sm:h-11 px-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111827]">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
                className="w-full h-10 sm:h-11 px-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111827]">Role / Title</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                placeholder="e.g. Student / Developer"
                className="w-full h-10 sm:h-11 px-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Task Preferences */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-6 shadow-2xs flex flex-col gap-4 sm:gap-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E7EB]">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Default Preferences</h2>
              <p className="text-xs text-[#6B7280]">
                Pre-selected values for new tasks and quick actions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111827]">Default Task Category</label>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value as Category)}
                className="w-full h-10 sm:h-11 px-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all cursor-pointer"
              >
                <option value="Study">Study</option>
                <option value="Coding">Coding</option>
                <option value="Project">Project</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111827]">Default Task Priority</label>
              <select
                value={defaultPriority}
                onChange={(e) => setDefaultPriority(e.target.value as Priority)}
                className="w-full h-10 sm:h-11 px-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-6 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E7EB]">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Appearance</h2>
              <p className="text-xs text-[#6B7280]">UI theme and visual layout</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
                <Sun className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#111827]">Modern Light Theme</span>
                <span className="text-[10px] sm:text-[11px] text-[#6B7280]">
                  Clean cool-gray palette with indigo accents (Default)
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shrink-0">
              Active
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto h-11 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>

      {/* Sample / Demo Data Section */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-6 shadow-2xs flex flex-col gap-4 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Demo &amp; Sample Workspace</h2>
              <p className="text-xs text-[#6B7280]">
                Explore DayFlow with simulated tasks and routines or clear them at any time.
              </p>
            </div>
          </div>
          {isDemoData && (
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
              Demo workspace active
            </span>
          )}
        </div>

        {isDemoData ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200">
            <div>
              <p className="text-xs font-bold text-amber-900">Sample Data Loaded</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your workspace currently contains sample demonstration tasks, routines, and progress.
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirmClearDemo}
              className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer w-full sm:w-auto shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Demo Data</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-[#E5E7EB]">
            <div>
              <p className="text-xs font-bold text-[#111827]">Explore with Sample Data</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Populate DayFlow with sample tasks and habits to preview full charts and features.
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirmLoadDemo}
              className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer w-full sm:w-auto shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore with Sample Data</span>
            </button>
          </div>
        )}
      </div>

      {/* Account Data Storage & Reset Section */}
      <div className="bg-white border border-red-200 rounded-2xl p-4 sm:p-6 shadow-2xs flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-red-100">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#111827]">Account Data Storage &amp; Reset</h2>
            <p className="text-xs text-[#6B7280]">
              Permanently clear tasks and routines scoped specifically to {user?.email || 'your account'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-red-50/40 border border-red-100">
          <div>
            <p className="text-xs font-bold text-[#111827]">Clear All My Data</p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Permanently delete all tasks, routines, and completion records for this account.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConfirmClearData}
            className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer w-full sm:w-auto shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear My Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
