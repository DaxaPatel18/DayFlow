import React, { useMemo } from 'react';
import {
  Repeat,
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  Sun,
  Zap,
  BookOpen,
  Moon,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useDayFlow } from '../context/DayFlowContext';
import { RoutineItem } from '../components/RoutineItem';
import { toISODateString } from '../utils/dateHelpers';

/** Compute consecutive days backwards where >=50% of scheduled routines were completed */
function computeStreak(
  routines: { id: string; repeatDays: number[]; enabled: boolean }[],
  routineCompletions: Record<string, Record<string, boolean>>
): number {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = toISODateString(d);
    const dayOfWeek = d.getDay();
    const scheduled = routines.filter((r) => r.enabled && r.repeatDays.includes(dayOfWeek));
    if (scheduled.length === 0) {
      if (i > 0) continue; // skip days with no scheduled routines
      else break;
    }
    const completions = routineCompletions[dateStr] || {};
    const completed = scheduled.filter((r) => completions[r.id]).length;
    if (completed / scheduled.length >= 0.5) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Compute average start time across all enabled routines */
function computeAvgStartTime(routines: { time: string; enabled: boolean }[]): string {
  const enabled = routines.filter((r) => r.enabled);
  if (enabled.length === 0) return '—';
  const minutes = enabled
    .map((r) => {
      try {
        const parts = r.time.trim().split(' ');
        const [h, m] = parts[0].split(':').map(Number);
        let hours = h % 12;
        if (parts[1] === 'PM') hours += 12;
        return hours * 60 + (m || 0);
      } catch {
        return null;
      }
    })
    .filter((m): m is number => m !== null);
  if (minutes.length === 0) return '—';
  const avg = Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length);
  const h = Math.floor(avg / 60);
  const min = avg % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${ampm}`;
}

export const RoutinePage: React.FC = () => {
  const {
    routines,
    todayDate,
    openAddRoutineModal,
    routineCompletions,
    isRoutineCompletedForDate,
    isLoadingData,
    dataError,
    retryFetchData,
  } = useDayFlow();

  const currentDayOfWeek = new Date().getDay();

  // Computed metrics
  const streak = useMemo(() => computeStreak(routines, routineCompletions), [routines, routineCompletions]);
  const avgStartTime = useMemo(() => computeAvgStartTime(routines), [routines]);

  // Summary Metrics
  const activeRoutines = routines.filter((r) => r.enabled);
  const scheduledToday = routines.filter((r) => r.enabled && r.repeatDays.includes(currentDayOfWeek));
  const completedTodayCount = scheduledToday.filter((r) =>
    isRoutineCompletedForDate(r.id, todayDate)
  ).length;
  const completionRate =
    scheduledToday.length > 0 ? Math.round((completedTodayCount / scheduledToday.length) * 100) : 0;

  // Helper to parse time in minutes from midnight for grouping
  const getTimeInMinutes = (timeStr: string): number => {
    try {
      const [time, ampm] = timeStr.trim().split(' ');
      const [h, m] = time.split(':').map(Number);
      let hours = h % 12;
      if (ampm === 'PM') hours += 12;
      return hours * 60 + (m || 0);
    } catch {
      return 0;
    }
  };

  // Group routines into 4 distinct rituals
  const morningRituals = routines.filter((r) => getTimeInMinutes(r.time) < 10 * 60);
  const focusDeepWork = routines.filter((r) => {
    const mins = getTimeInMinutes(r.time);
    return mins >= 10 * 60 && mins < 13 * 60;
  });
  const afternoonSkills = routines.filter((r) => {
    const mins = getTimeInMinutes(r.time);
    return mins >= 13 * 60 && mins < 18 * 60;
  });
  const eveningReflection = routines.filter((r) => getTimeInMinutes(r.time) >= 18 * 60);

  if (isLoadingData) {
    return (
      <div className="flex flex-col gap-7 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-14 bg-slate-200 rounded-2xl w-1/3"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7 w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">MY WORKSPACE</span>
            <span className="text-[#D1D5DB]">›</span>
            <span className="text-xs text-[#6B7280] font-medium">Daily Habits</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">My Daily Routine</h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Build lasting habits and structure your recurring daily schedule.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAddRoutineModal()}
          className="flex items-center justify-center gap-2 h-10 sm:h-11 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Routine</span>
        </button>
      </div>

      {/* Error Retry Banner */}
      {dataError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold">Couldn't load your routines. Try again.</span>
          </div>
          <button
            type="button"
            onClick={retryFetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Routines */}
        <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7280]">Active Routines</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight tabular-nums">
              {activeRoutines.length}
            </span>
            <p className="text-[10px] sm:text-[11px] text-[#6B7280] mt-0.5 truncate">of {routines.length} total enabled</p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7280]">Completion Rate</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 tracking-tight tabular-nums">
              {scheduledToday.length > 0 ? `${completionRate}%` : '—'}
            </span>
            {scheduledToday.length > 0 && (
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1.5 mb-1">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            )}
            <p className="text-[10px] sm:text-[11px] text-[#6B7280] mt-0.5 truncate">
              {scheduledToday.length > 0
                ? `${completedTodayCount} of ${scheduledToday.length} today`
                : 'No routines scheduled'}
            </p>
          </div>
        </div>

        {/* Current Streak */}
        <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7280]">Current Streak</span>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
              streak > 0 ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-amber-50 text-amber-500'
            }`}>
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight tabular-nums">
                {streak}
              </span>
              <span className="text-xs font-semibold text-[#6B7280]">Days</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-600 font-medium mt-0.5 truncate">
              {streak >= 7 ? '🔥 Amazing streak!' : streak > 0 ? 'Keep it up!' : 'Start streak today'}
            </p>
          </div>
        </div>

        {/* Average Start Time */}
        <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7280]">Avg Start Time</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">{avgStartTime}</span>
            <p className="text-[10px] sm:text-[11px] text-[#6B7280] mt-0.5 truncate">Across enabled routines</p>
          </div>
        </div>
      </div>

      {/* RITUALS LIST OR EMPTY STATE */}
      {routines.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center shadow-2xs flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Repeat className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">No routines yet</h3>
          <p className="text-sm text-[#6B7280] max-w-md mt-1 mb-6">
            Add your first daily routine or recurring habit to start building lasting consistency.
          </p>
          <button
            type="button"
            onClick={() => openAddRoutineModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Routine</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 1. Morning Rituals */}
          <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111827]">Morning Rituals</h2>
                  <p className="text-[11px] text-[#6B7280]">Awakening, body readiness, and mindset</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#6B7280]">
                {morningRituals.length} routines
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {morningRituals.length === 0 ? (
                <div className="py-4 px-3 text-center rounded-xl bg-slate-50/60 border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
                  No morning rituals configured yet.
                </div>
              ) : (
                morningRituals.map((r) => (
                  <RoutineItem key={r.id} routine={r} dateStr={todayDate} showManagementControls={true} />
                ))
              )}
            </div>
          </div>

          {/* 2. Focus & Deep Work */}
          <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111827]">Focus & Deep Work</h2>
                  <p className="text-[11px] text-[#6B7280]">Core problem solving, algorithms, and theory</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#6B7280]">
                {focusDeepWork.length} routines
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {focusDeepWork.length === 0 ? (
                <div className="py-4 px-3 text-center rounded-xl bg-slate-50/60 border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
                  No focus routines configured yet.
                </div>
              ) : (
                focusDeepWork.map((r) => (
                  <RoutineItem key={r.id} routine={r} dateStr={todayDate} showManagementControls={true} />
                ))
              )}
            </div>
          </div>

          {/* 3. Afternoon Skill Building */}
          <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111827]">Afternoon Skill Building</h2>
                  <p className="text-[11px] text-[#6B7280]">Projects, code refactoring, and tuning</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#6B7280]">
                {afternoonSkills.length} routines
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {afternoonSkills.length === 0 ? (
                <div className="py-4 px-3 text-center rounded-xl bg-slate-50/60 border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
                  No afternoon skill routines configured yet.
                </div>
              ) : (
                afternoonSkills.map((r) => (
                  <RoutineItem key={r.id} routine={r} dateStr={todayDate} showManagementControls={true} />
                ))
              )}
            </div>
          </div>

          {/* 4. Evening Reflection & Wind-down */}
          <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111827]">Evening Reflection & Wind-down</h2>
                  <p className="text-[11px] text-[#6B7280]">Reading, tomorrow's plan, and recovery</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#6B7280]">
                {eveningReflection.length} routines
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {eveningReflection.length === 0 ? (
                <div className="py-4 px-3 text-center rounded-xl bg-slate-50/60 border border-dashed border-[#E5E7EB] text-xs text-[#6B7280]">
                  No evening reflection routines configured yet.
                </div>
              ) : (
                eveningReflection.map((r) => (
                  <RoutineItem key={r.id} routine={r} dateStr={todayDate} showManagementControls={true} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
