import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Sparkles,
  Lightbulb,
  Edit2,
  Trash2,
  CalendarDays,
  Award,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useDayFlow } from '../context/DayFlowContext';
import { Task } from '../types';
import {
  getCalendarGridForMonth,
  formatMonthDayYear,
  formatFriendlyMonthDay,
  formatFullDate,
  toISODateString,
  getTodayISODate,
  getWeekDaysForDate,
  getCalendarContextualInsight,
} from '../utils/dateHelpers';
import { getCategoryTheme, getPriorityTheme } from '../utils/categoryColors';
import { getMonthlyMilestone } from '../utils/milestoneHelpers';

export const CalendarPage: React.FC = () => {
  const {
    tasks,
    routines,
    routineCompletions,
    todayDate,
    isLoadingData,
    dataError,
    retryFetchData,
    openAddTaskModal,
    toggleTaskComplete,
    deleteTask,
    openConfirmModal,
  } = useDayFlow();

  // Current view month & year state (defaults to today)
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayISODate());
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Month');

  // Navigation handlers based on active viewMode
  const handlePrev = () => {
    if (viewMode === 'Month') {
      if (currentMonthIndex === 0) {
        setCurrentMonthIndex(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonthIndex(currentMonthIndex - 1);
      }
    } else if (viewMode === 'Week') {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const prevWeekDate = new Date(y, m - 1, d - 7);
      const iso = toISODateString(prevWeekDate);
      setSelectedDate(iso);
      setCurrentYear(prevWeekDate.getFullYear());
      setCurrentMonthIndex(prevWeekDate.getMonth());
    } else if (viewMode === 'Day') {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const prevDay = new Date(y, m - 1, d - 1);
      const iso = toISODateString(prevDay);
      setSelectedDate(iso);
      setCurrentYear(prevDay.getFullYear());
      setCurrentMonthIndex(prevDay.getMonth());
    }
  };

  const handleNext = () => {
    if (viewMode === 'Month') {
      if (currentMonthIndex === 11) {
        setCurrentMonthIndex(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonthIndex(currentMonthIndex + 1);
      }
    } else if (viewMode === 'Week') {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const nextWeekDate = new Date(y, m - 1, d + 7);
      const iso = toISODateString(nextWeekDate);
      setSelectedDate(iso);
      setCurrentYear(nextWeekDate.getFullYear());
      setCurrentMonthIndex(nextWeekDate.getMonth());
    } else if (viewMode === 'Day') {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const nextDay = new Date(y, m - 1, d + 1);
      const iso = toISODateString(nextDay);
      setSelectedDate(iso);
      setCurrentYear(nextDay.getFullYear());
      setCurrentMonthIndex(nextDay.getMonth());
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonthIndex(today.getMonth());
    setSelectedDate(todayDate);
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const currentMonthLabel = `${monthNames[currentMonthIndex]} ${currentYear}`;

  // Week days for Week view
  const weekDays = useMemo(() => {
    return getWeekDaysForDate(selectedDate, selectedDate);
  }, [selectedDate]);

  // Dynamic header label based on active view mode
  const currentViewLabel = useMemo(() => {
    if (viewMode === 'Month') return currentMonthLabel;
    if (viewMode === 'Week') {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${formatFriendlyMonthDay(start.dateString)} – ${formatFriendlyMonthDay(end.dateString)}, ${currentYear}`;
    }
    return formatFullDate(selectedDate);
  }, [viewMode, currentMonthLabel, weekDays, currentYear, selectedDate]);

  // Generate cells for month
  const calendarCells = useMemo(() => {
    return getCalendarGridForMonth(currentYear, currentMonthIndex);
  }, [currentYear, currentMonthIndex]);

  // Map tasks by date
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [tasks]);

  // Selected date tasks for Inspector
  const selectedDateTasks = tasksByDate[selectedDate] || [];
  const selectedTotalCount = selectedDateTasks.length;
  const selectedCompletedCount = selectedDateTasks.filter((t) => t.completed).length;
  const selectedPct =
    selectedTotalCount > 0 ? Math.round((selectedCompletedCount / selectedTotalCount) * 100) : 0;

  // Month schedule load: (scheduledDays / daysInMonth) * 100
  const monthScheduleLoad = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const scheduledDateSet = new Set(
      tasks.filter((t) => t.date.startsWith(prefix)).map((t) => t.date)
    );
    const scheduledDays = scheduledDateSet.size;
    if (scheduledDays === 0 || daysInMonth === 0) return 0;
    return Math.round((scheduledDays / daysInMonth) * 100);
  }, [tasks, currentYear, currentMonthIndex]);

  // Smart Milestone selection derived strictly from live user activity
  const milestone = useMemo(() => {
    return getMonthlyMilestone(
      tasks,
      routines,
      routineCompletions,
      currentYear,
      currentMonthIndex
    );
  }, [tasks, routines, routineCompletions, currentYear, currentMonthIndex]);

  // Friendly date formatting for button & insights
  const friendlySelectedDate = formatFriendlyMonthDay(selectedDate);
  const contextualInsight = getCalendarContextualInsight(
    selectedTotalCount,
    selectedCompletedCount,
    selectedDate === todayDate,
    friendlySelectedDate
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Breadcrumb & Controls Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs tracking-wide uppercase">
              Workspace Schedule
            </span>
            <span className="text-[#D1D5DB]">•</span>
            <span className="text-xs text-[#6B7280] font-medium">{currentViewLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">Calendar</h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Schedule, plan, and organize tasks across dates with fluid cadence
          </p>
        </div>

        {/* View Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Month/Week/Day Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-[#E5E7EB]">
            {(['Month', 'Week', 'Day'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Previous / Label / Next Navigation with Today Button */}
          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
              title={viewMode === 'Month' ? 'Previous Month' : viewMode === 'Week' ? 'Previous Week' : 'Previous Day'}
              aria-label={viewMode === 'Month' ? 'Previous Month' : viewMode === 'Week' ? 'Previous Week' : 'Previous Day'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 sm:px-3 text-xs font-bold text-[#111827] min-w-[110px] sm:min-w-[140px] text-center select-none truncate">
              {currentViewLabel}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
              title={viewMode === 'Month' ? 'Next Month' : viewMode === 'Week' ? 'Next Week' : 'Next Day'}
              aria-label={viewMode === 'Month' ? 'Next Month' : viewMode === 'Week' ? 'Next Week' : 'Next Day'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoToToday}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#111827] font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* Error state if data fetch failed */}
      {dataError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{dataError}</span>
          </div>
          <button
            type="button"
            onClick={retryFetchData}
            className="inline-flex items-center gap-1 font-semibold text-red-700 hover:text-red-900 underline"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* TWO-COLUMN CALENDAR VIEW: LEFT CALENDAR (8 COLS), RIGHT INSPECTOR PANEL (4 COLS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PRIMARY CALENDAR AREA (~70% width / 8 COLS) */}
        <div className="xl:col-span-8 bg-white border border-[#E5E7EB] rounded-2xl p-3 sm:p-6 shadow-2xs flex flex-col">
          {/* VIEW MODE 1: MONTH VIEW */}
          {viewMode === 'Month' && (
            <>
              {/* Day of Week Header Row */}
              <div className="grid grid-cols-7 mb-2 border-b border-[#F3F4F6] pb-2 sm:pb-3 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <span key={d} className="text-[10px] sm:text-xs font-bold text-[#6B7280] tracking-wider uppercase">
                    {d}
                  </span>
                ))}
              </div>

              {/* Skeleton or Calendar Grid */}
              {isLoadingData ? (
                <div className="grid grid-cols-7 gap-1 sm:gap-2 my-2 animate-pulse">
                  {Array.from({ length: 35 }).map((_, idx) => (
                    <div key={idx} className="min-h-[58px] sm:min-h-[96px] rounded-xl bg-slate-50 border border-slate-100 p-1.5 sm:p-2 flex flex-col justify-between">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-200 self-end" />
                      <div className="w-full h-2.5 sm:h-3 rounded bg-slate-200 mt-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {calendarCells.map((cell) => {
                    const isSelected = cell.dateString === selectedDate;
                    const isToday = cell.isToday;
                    const cellTasks = tasksByDate[cell.dateString] || [];

                    return (
                      <div
                        key={cell.dateString}
                        onClick={() => setSelectedDate(cell.dateString)}
                        className={`min-h-[58px] sm:min-h-[96px] p-1 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20 shadow-xs z-10'
                            : cell.isCurrentMonth
                            ? 'border-[#E5E7EB] bg-white hover:border-indigo-300 hover:bg-slate-50/50'
                            : 'border-[#F3F4F6] bg-slate-50/40 text-[#9CA3AF]'
                        }`}
                      >
                        {/* Date Number Badge */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition-colors ${
                              isToday
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : isSelected
                                ? 'text-indigo-700 bg-indigo-100/70 font-black'
                                : cell.isCurrentMonth
                                ? 'text-[#111827]'
                                : 'text-[#9CA3AF]'
                            }`}
                          >
                            {cell.dayNumber}
                          </span>

                          {cellTasks.length > 0 && !isToday && !isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                          )}
                        </div>

                        {/* Mobile: compact dot indicators */}
                        <div className="flex sm:hidden items-center justify-center gap-0.5 mt-0.5 flex-wrap">
                          {cellTasks.slice(0, 3).map((t) => (
                            <span key={t.id} className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          ))}
                          {cellTasks.length > 3 && (
                            <span className="text-[8px] font-bold text-indigo-600">+{cellTasks.length - 3}</span>
                          )}
                        </div>

                        {/* Desktop & Tablet: Task Pills (up to 2 short items) */}
                        <div className="hidden sm:flex flex-col gap-1 mt-1">
                          {cellTasks.slice(0, 2).map((t) => {
                            const theme = getCategoryTheme(t.category);
                            return (
                              <div
                                key={t.id}
                                title={`${t.title} (${t.time})`}
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate border ${theme.chipClass} ${
                                  t.completed ? 'line-through opacity-60' : ''
                                }`}
                              >
                                {t.title}
                              </div>
                            );
                          })}

                          {cellTasks.length > 2 && (
                            <span className="text-[10px] font-semibold text-indigo-600 px-0.5">
                              +{cellTasks.length - 2} more
                            </span>
                          )}

                          {cellTasks.length === 0 && <div className="h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* VIEW MODE 2: WEEK VIEW */}
          {viewMode === 'Week' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {weekDays.map((day) => {
                  const dayTasks = tasksByDate[day.dateString] || [];
                  const isSelected = day.dateString === selectedDate;

                  return (
                    <div
                      key={day.dateString}
                      onClick={() => setSelectedDate(day.dateString)}
                      className={`flex flex-col rounded-2xl border p-3 min-h-[140px] sm:min-h-[300px] lg:min-h-[360px] transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/20 shadow-xs'
                          : day.isToday
                          ? 'border-indigo-200 bg-white'
                          : 'border-[#E5E7EB] bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#F3F4F6]">
                        <div>
                          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                            {day.dayName}
                          </span>
                          <span
                            className={`w-7 h-7 mt-1 rounded-full flex items-center justify-center font-bold text-sm ${
                              day.isToday
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : isSelected
                                ? 'bg-indigo-100 text-indigo-700 font-extrabold'
                                : 'text-[#111827]'
                            }`}
                          >
                            {day.dayNumber}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#6B7280] bg-slate-100 px-2 py-0.5 rounded-full">
                          {dayTasks.length}
                        </span>
                      </div>

                      {/* Day Task List */}
                      <div className="flex-1 flex flex-col gap-2 mt-2.5 overflow-y-auto">
                        {dayTasks.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-2 text-[#9CA3AF]">
                            <span className="text-[11px] italic">No tasks</span>
                          </div>
                        ) : (
                          dayTasks.map((t) => {
                            const catStyle = getCategoryTheme(t.category);
                            return (
                              <div
                                key={t.id}
                                className={`p-2 rounded-xl border text-xs flex flex-col gap-1 transition-all ${
                                  t.completed
                                    ? 'bg-slate-50/80 border-[#E5E7EB] text-[#9CA3AF] line-through'
                                    : 'bg-white border-[#E5E7EB] shadow-2xs hover:border-indigo-300'
                                }`}
                              >
                                <div className="flex items-start gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTaskComplete(t.id);
                                    }}
                                    aria-label={t.completed ? 'Mark task incomplete' : 'Mark task complete'}
                                    className={`w-3.5 h-3.5 rounded border mt-0.5 flex items-center justify-center shrink-0 ${
                                      t.completed
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </button>
                                  <span className="font-semibold text-[11px] text-[#111827] line-clamp-2 leading-tight">
                                    {t.title}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-[#6B7280] mt-0.5">
                                  <span className={`px-1.5 py-0.2 rounded font-medium border ${catStyle.chipClass}`}>
                                    {t.category}
                                  </span>
                                  <span>{t.time}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Add Task for This Day Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day.dateString);
                          openAddTaskModal({ date: day.dateString });
                        }}
                        className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40 text-slate-600 hover:text-indigo-600 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE 3: DAY VIEW */}
          {viewMode === 'Day' && (
            <div className="flex flex-col gap-5">
              {/* Day Header Summary Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <div>
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                    {selectedDate === todayDate ? "Today's Schedule" : 'Daily Agenda'}
                  </span>
                  <h3 className="text-lg font-bold text-[#111827]">
                    {formatFullDate(selectedDate)}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {selectedTotalCount} task{selectedTotalCount === 1 ? '' : 's'} scheduled • {selectedCompletedCount} completed
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddTaskModal({ date: selectedDate })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Day's Tasks Timeline */}
              {selectedDateTasks.length === 0 ? (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center bg-slate-50/60 rounded-2xl border border-dashed border-[#E5E7EB]">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-[#9CA3AF] mb-3">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-[#111827]">No tasks scheduled for this day</h4>
                  <p className="text-xs text-[#6B7280] max-w-sm mt-1 mb-4">
                    Your agenda is completely open. Plan a new priority or take time to recharge.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAddTaskModal({ date: selectedDate })}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Task for {friendlySelectedDate}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Timed Tasks Section */}
                  {selectedDateTasks.filter((t) => t.time && t.time !== 'Anytime').length > 0 && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-1.5 px-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-bold text-[#111827] uppercase tracking-wide">
                          Timed Schedule ({selectedDateTasks.filter((t) => t.time && t.time !== 'Anytime').length})
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {selectedDateTasks
                          .filter((t) => t.time && t.time !== 'Anytime')
                          .slice()
                          .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                          .map((t) => {
                            const catTheme = getCategoryTheme(t.category);
                            const prioTheme = getPriorityTheme(t.priority);

                            return (
                              <div
                                key={t.id}
                                className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                                  t.completed
                                    ? 'bg-slate-50/70 border-[#E5E7EB] opacity-75'
                                    : 'bg-white border-[#E5E7EB] hover:border-indigo-300 hover:shadow-2xs'
                                }`}
                              >
                                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleTaskComplete(t.id)}
                                    aria-label={t.completed ? 'Mark task incomplete' : 'Mark task complete'}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 active:scale-85 mt-0.5 cursor-pointer ${
                                      t.completed
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'border-[#D1D5DB] hover:border-indigo-600 bg-white text-transparent'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>

                                  <div className="flex flex-col min-w-0">
                                    <span
                                      className={`text-sm font-semibold text-[#111827] truncate ${
                                        t.completed ? 'line-through text-[#9CA3AF]' : ''
                                      }`}
                                    >
                                      {t.title}
                                    </span>
                                    {t.description && (
                                      <p className="text-xs text-[#6B7280] mt-1 leading-relaxed line-clamp-2">
                                        {t.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catTheme.chipClass}`}>
                                        {t.category}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${prioTheme.badge}`}>
                                        {t.priority}
                                      </span>
                                      <span className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                                        <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                        {t.time}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => openAddTaskModal({ id: t.id })}
                                    aria-label={`Edit task ${t.title}`}
                                    className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-slate-100 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openConfirmModal({
                                        title: 'Delete Task?',
                                        message: `Are you sure you want to delete "${t.title}"?`,
                                        confirmButtonText: 'Delete Task',
                                        isDanger: true,
                                        onConfirm: () => deleteTask(t.id),
                                      });
                                    }}
                                    aria-label={`Delete task ${t.title}`}
                                    className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Anytime Tasks Section */}
                  {selectedDateTasks.filter((t) => !t.time || t.time === 'Anytime').length > 0 && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-1.5 px-1">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-bold text-[#111827] uppercase tracking-wide">
                          Anytime Tasks ({selectedDateTasks.filter((t) => !t.time || t.time === 'Anytime').length})
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {selectedDateTasks
                          .filter((t) => !t.time || t.time === 'Anytime')
                          .map((t) => {
                            const catTheme = getCategoryTheme(t.category);
                            const prioTheme = getPriorityTheme(t.priority);

                            return (
                              <div
                                key={t.id}
                                className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                                  t.completed
                                    ? 'bg-slate-50/70 border-[#E5E7EB] opacity-75'
                                    : 'bg-white border-[#E5E7EB] hover:border-indigo-300 hover:shadow-2xs'
                                }`}
                              >
                                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleTaskComplete(t.id)}
                                    aria-label={t.completed ? 'Mark task incomplete' : 'Mark task complete'}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 active:scale-85 mt-0.5 cursor-pointer ${
                                      t.completed
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'border-[#D1D5DB] hover:border-indigo-600 bg-white text-transparent'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>

                                  <div className="flex flex-col min-w-0">
                                    <span
                                      className={`text-sm font-semibold text-[#111827] truncate ${
                                        t.completed ? 'line-through text-[#9CA3AF]' : ''
                                      }`}
                                    >
                                      {t.title}
                                    </span>
                                    {t.description && (
                                      <p className="text-xs text-[#6B7280] mt-1 leading-relaxed line-clamp-2">
                                        {t.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catTheme.chipClass}`}>
                                        {t.category}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${prioTheme.badge}`}>
                                        {t.priority}
                                      </span>
                                      <span className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                                        <CalendarDays className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                        Anytime
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => openAddTaskModal({ id: t.id })}
                                    aria-label={`Edit task ${t.title}`}
                                    className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-slate-100 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openConfirmModal({
                                        title: 'Delete Task?',
                                        message: `Are you sure you want to delete "${t.title}"?`,
                                        confirmButtonText: 'Delete Task',
                                        isDanger: true,
                                        onConfirm: () => deleteTask(t.id),
                                      });
                                    }}
                                    aria-label={`Delete task ${t.title}`}
                                    className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* BOTTOM OF CALENDAR: CATEGORY LEGEND & MONTH SCHEDULE LOAD */}
          <div className="mt-5 pt-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Study
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Coding
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Work
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Health
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Personal
              </span>
            </div>

            {/* DYNAMIC MONTH SCHEDULE LOAD */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B7280] font-medium">Month Schedule Load:</span>
              <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${monthScheduleLoad}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[#111827] tabular-nums">
                {monthScheduleLoad}%
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: ORGANIZED LOGICAL LAYOUT (~30% width / 4 COLS) */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          {/* Main Inspector Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col gap-4">
            {/* 1. SELECTED DATE HEADER */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                  Schedule Inspector
                </span>
                <h2 className="text-lg font-bold text-[#111827]">
                  {formatMonthDayYear(selectedDate)}
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                {selectedTotalCount} Task{selectedTotalCount === 1 ? '' : 's'}
              </span>
            </div>

            {/* 2. TASK COUNT + COMPLETION PROGRESS */}
            <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#4B5563]">
                  {selectedCompletedCount} of {selectedTotalCount} completed
                </span>
                <span className="font-bold text-indigo-600 tabular-nums">{selectedPct}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${selectedPct}%` }}
                />
              </div>
            </div>

            {/* 3. PROMINENT ADD TASK BUTTON (FRIENDLY DATE DISPLAY & NO DUPLICATE +) */}
            <button
              type="button"
              onClick={() => openAddTaskModal({ date: selectedDate })}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-2xs hover:bg-indigo-700 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task for {friendlySelectedDate}</span>
            </button>

            {/* 4. TASKS FOR SELECTED DATE (COMPACT EMPTY STATE IF NONE) */}
            <div className="flex flex-col gap-2 mt-1">
              {selectedDateTasks.length === 0 ? (
                <div className="py-6 px-4 text-center flex flex-col items-center justify-center bg-slate-50/60 rounded-xl border border-dashed border-[#E5E7EB]">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#9CA3AF] mb-1.5">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-xs text-[#111827]">No tasks scheduled</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Your day is open.</p>
                </div>
              ) : (
                selectedDateTasks.map((t) => {
                  const styles = getCategoryTheme(t.category);
                  const prioTheme = getPriorityTheme(t.priority);

                  return (
                    <div
                      key={t.id}
                      className="group flex items-start justify-between p-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50/60 transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleTaskComplete(t.id)}
                          aria-label={t.completed ? 'Mark task incomplete' : 'Mark task complete'}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 active:scale-85 ${
                            t.completed
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                              : 'border-[#D1D5DB] hover:border-indigo-600 bg-white text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div className="flex flex-col min-w-0 pr-1">
                          <span
                            className={`text-xs font-semibold text-[#111827] truncate ${
                              t.completed ? 'line-through text-[#9CA3AF]' : ''
                            }`}
                          >
                            {t.title}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${styles.chipClass}`}
                            >
                              {t.category}
                            </span>
                            <span className="text-[#D1D5DB]">•</span>
                            <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#9CA3AF]" />
                              {t.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${prioTheme.badge}`}
                        >
                          {t.priority}
                        </span>
                        <button
                          type="button"
                          onClick={() => openAddTaskModal({ id: t.id })}
                          className="p-1 text-[#9CA3AF] hover:text-[#111827] rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Edit Task"
                          aria-label="Edit Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openConfirmModal({
                              title: 'Delete Task?',
                              message: `Are you sure you want to delete "${t.title}"?`,
                              confirmButtonText: 'Delete Task',
                              isDanger: true,
                              onConfirm: () => deleteTask(t.id),
                            })
                          }
                          className="p-1 text-[#9CA3AF] hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete Task"
                          aria-label="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 5. CONTEXTUAL INSIGHT */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center gap-2.5">
              <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs text-[#4B5563] font-medium leading-relaxed">
                {contextualInsight}
              </span>
            </div>
          </div>

          {/* 6. MONTHLY MILESTONE (LIVE USER DATA OR CLEAN EMPTY STATE) */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col gap-3">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Monthly Milestone
            </span>

            {milestone.hasMilestone ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111827]">{milestone.title}</h3>
                  <span className="text-xs font-bold text-indigo-600 tabular-nums">
                    {milestone.percentage}%
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">{milestone.subtitle}</p>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${milestone.percentage}%` }}
                  />
                </div>
              </div>
            ) : (
              /* MILESTONE EMPTY STATE (Requirement 5) */
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-xs font-bold text-[#111827]">{milestone.title}</span>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 leading-relaxed">
                    {milestone.subtitle}
                  </p>
                  <div className="mt-2.5">
                    <Link
                      to="/tasks"
                      className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-[#E5E7EB] hover:border-indigo-400 text-indigo-600 text-[11px] font-semibold shadow-2xs transition-colors"
                    >
                      View Tasks
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
