import React from 'react';
import {
  CheckCircle2,
  ListTodo,
  Clock,
  TrendingUp,
  Star,
  Plus,
  Repeat,
  Sparkles,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDayFlow } from '../context/DayFlowContext';
import { TaskCard } from '../components/TaskCard';
import { RoutineItem } from '../components/RoutineItem';
import { getCategoryTheme, getPriorityTheme } from '../utils/categoryColors';

export const Dashboard: React.FC = () => {
  const {
    tasks,
    routines,
    stats,
    todayDate,
    isLoadingData,
    dataError,
    retryFetchData,
    openAddTaskModal,
    openAddRoutineModal,
    toggleTaskComplete,
    loadDemoData,
  } = useDayFlow();

  // Today's custom tasks
  const todayTasks = tasks.filter((t) => t.date === todayDate);

  // Today's active routines (based on current day of week)
  const currentDayOfWeek = new Date().getDay();
  const todayRoutines = routines.filter(
    (r) => r.enabled && r.repeatDays.includes(currentDayOfWeek)
  );

  // Find Today's Top Focus: strictly explicit isFocus
  const topFocusTask = todayTasks.find((t) => t.isFocus);

  const isWorkspaceEmpty = tasks.length === 0 && routines.length === 0;

  const focusCatTheme = topFocusTask ? getCategoryTheme(topFocusTask.category) : null;
  const focusPrioTheme = topFocusTask ? getPriorityTheme(topFocusTask.priority) : null;

  return (
    <div className="flex flex-col gap-6 sm:gap-7 w-full animate-fade-in">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Your unified command center for today's priorities and routines.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => openAddRoutineModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#111827] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Repeat className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add Routine</span>
          </button>
          <button
            type="button"
            onClick={() => openAddTaskModal({ date: todayDate })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
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
            className="inline-flex items-center gap-1 font-semibold text-red-700 hover:text-red-900 underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* INTERACTIVE FIRST-TIME EXPERIENCE / DEMO CTA (DF-FUNC-032 & DF-FUNC-033) */}
      {!isLoadingData && isWorkspaceEmpty && (
        <div className="gradient-animated rounded-2xl p-6 text-white shadow-md relative overflow-hidden animate-fade-in">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                Welcome to DayFlow
              </span>
              <h2 className="text-xl font-bold mt-1.5">Get Started in 3 Simple Steps</h2>
              <p className="text-xs text-indigo-200 mt-1 max-w-lg">
                Build your daily momentum by setting your core priorities, daily habits, and tracking your velocity.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => loadDemoData()}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                Explore with Sample Data
              </button>
              <button
                type="button"
                onClick={() => openAddTaskModal({ date: todayDate })}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                + Create First Task
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-200 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <span className="text-indigo-100">Create your first task</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-200 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <span className="text-indigo-100">Add a daily routine</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-200 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <span className="text-indigo-100">Track your productivity score</span>
            </div>
          </div>
        </div>
      )}

      {/* TOP 4 DYNAMIC SUMMARY CARDS */}
      {isLoadingData ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs h-28 flex flex-col justify-between">
              <div className="w-20 h-3 bg-slate-200 rounded" />
              <div className="w-12 h-6 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tasks */}
          <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B7280]">Total Tasks</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ListTodo className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-[#111827] tracking-tight tabular-nums">
                {stats.totalTasksToday}
              </span>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Scheduled for today</p>
            </div>
          </div>

          {/* Completed */}
          <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B7280]">Completed</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-emerald-600 tracking-tight tabular-nums">
                {stats.completedToday}
              </span>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Checked off items</p>
            </div>
          </div>

          {/* Remaining */}
          <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B7280]">Remaining</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-[#111827] tracking-tight tabular-nums">
                {stats.remainingToday}
              </span>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Still in progress</p>
            </div>
          </div>

          {/* Productivity */}
          <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B7280]">Productivity</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-indigo-600 tracking-tight tabular-nums">
                {stats.productivityPct}%
              </span>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Today's velocity</p>
            </div>
          </div>
        </div>
      )}

      {/* 2-COLUMN FOCUS & PROGRESS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* TODAY'S TOP FOCUS CARD (7 COLS) */}
        <div className={`lg:col-span-7 bg-white border rounded-2xl p-6 shadow-2xs flex flex-col justify-between relative overflow-hidden transition-all ${
          topFocusTask ? 'border-l-4 border-l-indigo-500 border-t-[#E5E7EB] border-r-[#E5E7EB] border-b-[#E5E7EB]' : 'border-[#E5E7EB]'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <h2 className="text-base font-bold text-[#111827]">Today's Top Focus</h2>
            </div>
            {topFocusTask && (
              <span className="text-xs text-[#6B7280]">
                Target Deadline: <strong className="text-[#111827]">{topFocusTask.time}</strong>
              </span>
            )}
          </div>

          {topFocusTask ? (
            <div className="my-4 flex flex-col gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-bold text-[#111827] ${
                      topFocusTask.completed ? 'line-through text-[#9CA3AF]' : ''
                    }`}
                  >
                    {topFocusTask.title}
                  </span>
                </div>
                {topFocusTask.description && (
                  <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                    {topFocusTask.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {focusCatTheme && (
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${focusCatTheme.chipClass}`}
                  >
                    {topFocusTask.category}
                  </span>
                )}
                {focusPrioTheme && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${focusPrioTheme.badge}`}
                  >
                    {topFocusTask.priority} Priority
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* CLEAN EMPTY FOCUS STATE (DF-FUNC-004) */
            <div className="my-6 text-center py-6 px-4 flex flex-col items-center justify-center bg-slate-50/60 rounded-xl border border-dashed border-[#E5E7EB]">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-2.5">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm font-bold text-[#111827]">No focus task pinned yet</p>
              <p className="text-xs text-[#6B7280] mt-1 mb-3.5 max-w-xs">
                Choose one task to make your main priority today.
              </p>
              <Link
                to="/tasks"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer"
              >
                <span>Choose Focus Task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Action button */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">
              {topFocusTask
                ? topFocusTask.completed
                  ? 'Great job! Focus achieved.'
                  : 'Single-tasking beats multitasking.'
                : 'No active focus task yet.'}
            </span>
            {topFocusTask ? (
              <button
                type="button"
                onClick={() => toggleTaskComplete(topFocusTask.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                  topFocusTask.completed
                    ? 'bg-slate-100 text-[#4B5563] hover:bg-slate-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{topFocusTask.completed ? 'Undo Completion' : 'Mark Done'}</span>
              </button>
            ) : (
              <Link
                to="/tasks"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                My Tasks &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* TODAY'S PROGRESS CARD (5 COLS) */}
        <div className={`lg:col-span-5 bg-white border rounded-2xl p-6 shadow-2xs flex flex-col justify-between transition-all ${
          stats.productivityPct === 100 && stats.totalTasksToday > 0 ? 'border-emerald-200 ring-2 ring-emerald-50' : 'border-[#E5E7EB]'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  stats.productivityPct === 100 && stats.totalTasksToday > 0
                    ? 'bg-emerald-50 text-emerald-600 animate-pulse'
                    : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-[#111827]">Today's Progress</h2>
                  {stats.productivityPct === 100 && stats.totalTasksToday > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Completed
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-xl font-bold tabular-nums ${
                stats.productivityPct === 100 && stats.totalTasksToday > 0 ? 'text-emerald-600' : 'text-indigo-600'
              }`}>
                {stats.productivityPct}%
              </span>
            </div>

            <div className="my-5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs text-[#4B5563]">
                <span className="font-semibold">
                  {stats.completedToday} of {stats.totalTasksToday} tasks completed
                </span>
                <span className="text-[#6B7280]">{stats.remainingToday} remaining</span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    stats.productivityPct === 100 && stats.totalTasksToday > 0
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xs'
                      : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600'
                  }`}
                  style={{ width: `${stats.productivityPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between text-xs">
            <span className="text-[#6B7280]">
              {stats.totalTasksToday === 0
                ? 'Your day is clear. Add your first task or routine to get started.'
                : stats.productivityPct >= 80
                ? 'Outstanding cadence! Nearly all daily goals reached.'
                : stats.productivityPct >= 50
                ? 'Steady momentum! Keep ticking through your queue.'
                : 'Getting started! Conquer your highest priority first.'}
            </span>
            <Link
              to="/progress"
              className="text-indigo-600 hover:underline font-semibold flex items-center gap-1 shrink-0 ml-2"
            >
              Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* MAIN 2-COLUMN SECTION: ROUTINE & TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: DAILY ROUTINE (6 COLS) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#111827]">Daily Routine</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#6B7280] text-xs font-semibold">
                {todayRoutines.length}
              </span>
            </div>
            <Link
              to="/routine"
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Manage Routine <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            {todayRoutines.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-2xl flex flex-col items-center">
                <Repeat className="w-8 h-8 text-[#9CA3AF] mb-2" />
                <p className="text-sm font-semibold text-[#111827]">No routines scheduled for today</p>
                <p className="text-xs text-[#6B7280] mt-1 mb-3">
                  Set recurring morning or evening habits to build consistency.
                </p>
                <button
                  type="button"
                  onClick={() => openAddRoutineModal()}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-2xs hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Add Routine
                </button>
              </div>
            ) : (
              todayRoutines.map((routine) => (
                <RoutineItem key={routine.id} routine={routine} dateStr={todayDate} />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: CUSTOM TASKS FOR TODAY (6 COLS) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#111827]">Today's Tasks</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#6B7280] text-xs font-semibold">
                {todayTasks.length}
              </span>
            </div>
            <Link
              to="/tasks"
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              All Tasks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            {todayTasks.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-2xl flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-[#9CA3AF] mb-2" />
                <p className="text-sm font-semibold text-[#111827]">Your day is clear</p>
                <p className="text-xs text-[#6B7280] mt-1 mb-3">
                  Schedule deliverables and priorities for today.
                </p>
                <button
                  type="button"
                  onClick={() => openAddTaskModal({ date: todayDate })}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-2xs hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Add Today Task
                </button>
              </div>
            ) : (
              todayTasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
