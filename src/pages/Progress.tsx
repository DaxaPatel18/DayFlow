import React, { useMemo } from 'react';
import { jsPDF } from 'jspdf';
import {
  CheckCircle2,
  TrendingUp,
  Flame,
  Zap,
  Calendar,
  Clock,
  Sun,
  Award,
  Share2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useDayFlow } from '../context/DayFlowContext';
import { toISODateString } from '../utils/dateHelpers';

/** Returns array of Date objects for Sun-Sat of the current week */
function getCurrentWeekDates(): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

/** Compute streak: consecutive days (backwards from today) where routines were ≥50% completed */
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

    const scheduledForDay = routines.filter(
      (r) => r.enabled && r.repeatDays.includes(dayOfWeek)
    );
    if (scheduledForDay.length === 0) {
      // No routines scheduled — don't break streak for this day
      if (i > 0) continue;
      else break; // today has no routines, streak is 0
    }

    const completions = routineCompletions[dateStr] || {};
    const completedCount = scheduledForDay.filter((r) => completions[r.id]).length;
    const pct = completedCount / scheduledForDay.length;

    if (pct >= 0.5) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Average start time across enabled routines */
function computeAvgStartTime(routines: { time: string; enabled: boolean }[]): string {
  const enabled = routines.filter((r) => r.enabled);
  if (enabled.length === 0) return '—';
  const minutesList = enabled
    .map((r) => {
      try {
        const [timePart, ampm] = r.time.trim().split(' ');
        const [h, m] = timePart.split(':').map(Number);
        let hours = h % 12;
        if (ampm === 'PM') hours += 12;
        return hours * 60 + (m || 0);
      } catch {
        return null;
      }
    })
    .filter((m): m is number => m !== null);

  if (minutesList.length === 0) return '—';
  const avg = Math.round(minutesList.reduce((a, b) => a + b, 0) / minutesList.length);
  const hours = Math.floor(avg / 60);
  const mins = avg % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const display = `${hours % 12 || 12}:${String(mins).padStart(2, '0')} ${ampm}`;
  return display;
}

export const ProgressPage: React.FC = () => {
  const {
    tasks,
    routines,
    routineCompletions,
    settings,
    showToast,
    isLoadingData,
    dataError,
    retryFetchData,
  } = useDayFlow();

  // ----- WEEKLY BAR CHART DATA (real) -----
  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const weeklyData = useMemo(() => {
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weekDates.map((date, idx) => {
      const dateStr = toISODateString(date);
      const dayLabel = DAY_LABELS[idx];
      const dayOfWeek = date.getDay();

      // Completed custom tasks for this date
      const completedTasks = tasks.filter((t) => t.date === dateStr && t.completed).length;

      // Completed routines for this date
      const scheduledRoutines = routines.filter(
        (r) => r.enabled && r.repeatDays.includes(dayOfWeek)
      );
      const dayCompletions = routineCompletions[dateStr] || {};
      const completedRoutines = scheduledRoutines.filter((r) => dayCompletions[r.id]).length;

      const total = completedTasks + completedRoutines;
      return { day: dayLabel, tasks: total, date: dateStr };
    });
  }, [tasks, routines, routineCompletions, weekDates]);

  const totalWeeklyTasks = weeklyData.reduce((acc, d) => acc + d.tasks, 0);
  const peakDayIdx = weeklyData.reduce(
    (maxIdx, d, i, arr) => (d.tasks > arr[maxIdx].tasks ? i : maxIdx),
    0
  );
  const peakDayLabel = totalWeeklyTasks > 0 ? (weeklyData[peakDayIdx]?.day || '—') : '—';

  // ----- TASK CATEGORY DISTRIBUTION (real) -----
  const categoryData = useMemo(() => {
    const COLORS: Record<string, string> = {
      Study: '#8B5CF6',
      Coding: '#3B82F6',
      Work: '#F59E0B',
      Health: '#10B981',
      Personal: '#EC4899',
      Project: '#6366F1',
      Other: '#64748B',
    };
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    const entries = Object.entries(counts)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a);
    if (entries.length === 0) return [];
    const total = entries.reduce((acc, [, v]) => acc + v, 0);
    return entries.map(([name, value]) => ({
      name,
      value,
      color: COLORS[name] || '#64748B',
      pct: Math.round((value / total) * 100),
    }));
  }, [tasks]);

  const totalCatTasks = categoryData.reduce((acc, d) => acc + d.value, 0);
  const topCategory = categoryData[0];

  // ----- COMPLETION RATE (current week, real) -----
  const weeklyCompletionRate = useMemo(() => {
    const todayStr = toISODateString(new Date());
    let totalScheduled = 0;
    let totalCompleted = 0;
    weekDates.forEach((date) => {
      const dateStr = toISODateString(date);
      // Only count up to today
      if (dateStr > todayStr) return;
      const dayOfWeek = date.getDay();
      const scheduledTasks = tasks.filter((t) => t.date === dateStr);
      const scheduledRoutines = routines.filter(
        (r) => r.enabled && r.repeatDays.includes(dayOfWeek)
      );
      totalScheduled += scheduledTasks.length + scheduledRoutines.length;
      totalCompleted += scheduledTasks.filter((t) => t.completed).length;
      const dayCompletions = routineCompletions[dateStr] || {};
      totalCompleted += scheduledRoutines.filter((r) => dayCompletions[r.id]).length;
    });
    return totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : null;
  }, [tasks, routines, routineCompletions, weekDates]);

  // ----- STREAK -----
  const streak = useMemo(() => computeStreak(routines, routineCompletions), [routines, routineCompletions]);

  // ----- AVERAGE START TIME -----
  const avgStartTime = useMemo(() => computeAvgStartTime(routines), [routines]);

  // ----- HEATMAP: Last 12 weeks of routine completion -----
  const heatmapWeeks = useMemo(() => {
    const now = new Date();
    const today = toISODateString(now);
    const weeks: { weekIdx: number; days: { intensity: number; label: string; date: string }[] }[] = [];

    // Start from 11 weeks ago (Sunday)
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - now.getDay() - 11 * 7);

    for (let w = 0; w < 12; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + w * 7 + d);
        const dateStr = toISODateString(cellDate);
        const dayOfWeek = cellDate.getDay();

        // Don't show future dates
        if (dateStr > today) {
          days.push({ intensity: 0, label: 'Future', date: dateStr });
          continue;
        }

        const scheduledRoutines = routines.filter(
          (r) => r.enabled && r.repeatDays.includes(dayOfWeek)
        );
        if (scheduledRoutines.length === 0) {
          days.push({ intensity: 0, label: 'No routines', date: dateStr });
          continue;
        }

        const dayCompletions = routineCompletions[dateStr] || {};
        const completedCount = scheduledRoutines.filter((r) => dayCompletions[r.id]).length;
        const pct = completedCount / scheduledRoutines.length;

        let intensity = 0;
        if (pct > 0.85) intensity = 4;
        else if (pct > 0.6) intensity = 3;
        else if (pct > 0.3) intensity = 2;
        else if (pct > 0) intensity = 1;

        const pctLabel = pct > 0 ? `${Math.round(pct * 100)}% completed` : 'None completed';
        days.push({ intensity, label: pctLabel, date: dateStr });
      }
      weeks.push({ weekIdx: w, days });
    }
    return weeks;
  }, [routines, routineCompletions]);

  // Month labels for heatmap
  const heatmapMonthLabels = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
    }
    return labels;
  }, []);

  const handleExport = () => {
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = margin;

      const safe = (val: string | number | null | undefined, fallback = 'No data') =>
        val !== null && val !== undefined && val !== '' && !Number.isNaN(val)
          ? String(val)
          : fallback;

      // Header bar
      doc.setFillColor(99, 102, 241); // indigo-500
      doc.rect(0, 0, pageW, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('DAYFLOW', margin, 9);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Productivity Report', margin + 22, 9);

      y = 22;

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(17, 24, 39);
      doc.text('DayFlow Productivity Report', margin, y);
      y += 8;

      // User & date metadata
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      doc.text(`User: ${safe(settings.name, 'User')}`, margin, y);
      y += 5;
      doc.text(`Generated: ${dateStr}`, margin, y);
      y += 4;

      // Divider
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageW - margin, y);
      y += 7;

      // ── Section helper ──────────────────────────────────────────────
      const sectionTitle = (title: string) => {
        if (y > pageH - 30) { doc.addPage(); y = margin; }
        doc.setFillColor(238, 242, 255); // indigo-50
        doc.roundedRect(margin, y - 4, contentW, 8, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(67, 56, 202); // indigo-700
        doc.text(title.toUpperCase(), margin + 3, y + 0.5);
        y += 9;
        doc.setTextColor(17, 24, 39);
      };

      const row = (label: string, value: string, indent = 0) => {
        if (y > pageH - 15) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(label, margin + indent, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(value, margin + indent + 60, y);
        y += 5.5;
      };

      // ── Summary Metrics ─────────────────────────────────────────────
      sectionTitle('Summary Metrics');
      row('Tasks Completed This Week', safe(totalWeeklyTasks, '0'));
      row('Completion Rate', weeklyCompletionRate !== null ? `${weeklyCompletionRate}%` : 'No data');
      row('Current Streak', streak > 0 ? `${streak} day${streak === 1 ? '' : 's'}` : '0 days');
      row('Most Productive Day', safe(totalWeeklyTasks > 0 ? peakDayLabel : null));
      y += 2;

      // ── Weekly Productivity ─────────────────────────────────────────
      sectionTitle('Weekly Productivity');
      const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      if (totalWeeklyTasks === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text('No completions recorded this week.', margin + 3, y);
        y += 5.5;
      } else {
        weeklyData.forEach((d, i) => {
          if (y > pageH - 15) { doc.addPage(); y = margin; }
          const barMaxW = contentW - 70;
          const barW = totalWeeklyTasks > 0 ? Math.round((d.tasks / Math.max(...weeklyData.map(x => x.tasks))) * barMaxW) : 0;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(107, 114, 128);
          doc.text(DAY_LABELS[i], margin + 3, y);
          doc.setFillColor(i === peakDayIdx && d.tasks > 0 ? 124 : 99, i === peakDayIdx && d.tasks > 0 ? 58 : 102, i === peakDayIdx && d.tasks > 0 ? 237 : 241);
          if (barW > 0) doc.roundedRect(margin + 14, y - 3.5, barW, 4, 0.8, 0.8, 'F');
          doc.setTextColor(17, 24, 39);
          doc.setFont('helvetica', 'bold');
          doc.text(String(d.tasks), margin + 14 + barW + 2, y);
          y += 5.5;
        });
      }
      y += 2;

      // ── Tasks by Category ───────────────────────────────────────────
      sectionTitle('Tasks by Category');
      if (categoryData.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text('No tasks created yet.', margin + 3, y);
        y += 5.5;
      } else {
        categoryData.forEach((cat) => {
          row(cat.name, `${cat.value} task${cat.value !== 1 ? 's' : ''} (${cat.pct}%)`, 3);
        });
      }
      y += 2;

      // ── Routine Consistency ─────────────────────────────────────────
      sectionTitle('Routine Consistency');
      const enabledRoutines = routines.filter((r) => r.enabled).length;
      row('Active Routines', `${enabledRoutines} of ${routines.length}`);
      row('Current Streak', streak > 0 ? `${streak} day${streak === 1 ? '' : 's'}` : 'No active streak');
      row('Avg Routine Start Time', safe(avgStartTime));
      y += 2;

      // ── Focus Insights ──────────────────────────────────────────────
      sectionTitle('Focus Insights');
      const totalDone = tasks.filter((t) => t.completed).length;
      const totalTasksAll = tasks.length;
      const overallRate = totalTasksAll > 0 ? Math.round((totalDone / totalTasksAll) * 100) : null;
      row('Total Tasks (All Time)', safe(totalTasksAll, '0'));
      row('Total Completed', safe(totalDone, '0'));
      row('Overall Completion Rate', overallRate !== null ? `${overallRate}%` : 'No data');
      row('Top Category', categoryData.length > 0 ? `${categoryData[0].name} (${categoryData[0].pct}%)` : 'No data');
      y += 2;

      // ── Milestones ──────────────────────────────────────────────────
      const achievedMilestones: string[] = [];
      if (streak >= 7) achievedMilestones.push('🔥 7-Day Streak achieved');
      if (totalDone >= 10) achievedMilestones.push('✓ 10 Tasks completed');
      if (routines.length >= 3) achievedMilestones.push('🎯 3+ Routines set up');
      if (weeklyCompletionRate !== null && weeklyCompletionRate >= 80) achievedMilestones.push('⭐ 80% Weekly rate achieved');

      if (achievedMilestones.length > 0) {
        sectionTitle('Milestones Achieved');
        achievedMilestones.forEach((m) => {
          if (y > pageH - 15) { doc.addPage(); y = margin; }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(17, 24, 39);
          doc.text(m, margin + 3, y);
          y += 5.5;
        });
        y += 2;
      }

      // Footer on every page
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `DayFlow Productivity Report  •  Generated ${dateStr}  •  Page ${p} of ${totalPages}`,
          margin,
          pageH - 8
        );
      }

      const fileName = `DayFlow_Productivity_Report_${toISODateString(new Date())}.pdf`;
      doc.save(fileName);
      showToast('PDF report downloaded successfully', 'success');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Could not generate PDF report.', 'error');
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col gap-7 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-14 bg-slate-200 rounded-2xl w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          <div className="lg:col-span-8 flex flex-col gap-7">
            <div className="h-80 bg-slate-200 rounded-2xl"></div>
            <div className="h-60 bg-slate-200 rounded-2xl"></div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-7">
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
            <div className="h-44 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyProductivityData = tasks.length > 0 || routines.length > 0 || totalWeeklyTasks > 0;

  return (
    <div className="flex flex-col gap-6 sm:gap-7 w-full animate-fade-in">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs tracking-wide uppercase">
              Personal Progress Report
            </span>
            <span className="text-[#D1D5DB]">•</span>
            <span className="text-xs text-[#6B7280] font-medium">Current Week</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">Productivity &amp; Progress</h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            A clear look at your routines, completed tasks, and focus habits
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2 shadow-2xs">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-[#111827]">This Week</span>
              <span className="text-[10px] text-[#6B7280]">Current active cycle</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Error Retry Banner */}
      {dataError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold">Couldn't load your productivity data. Try again.</span>
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

      {/* Empty State Banner if completely fresh account */}
      {!hasAnyProductivityData && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 text-center shadow-2xs flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No productivity history yet</h3>
          <p className="text-xs sm:text-sm text-[#6B7280] max-w-md mt-1">
            Complete tasks to start seeing your progress.
          </p>
        </div>
      )}

      {/* TOP 4 SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tasks Completed This Week */}
        <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7280] truncate">Tasks Completed</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight tabular-nums">{totalWeeklyTasks}</span>
              <span className="text-xs font-semibold text-[#6B7280]">Tasks</span>
            </div>
            {totalWeeklyTasks === 0 ? (
              <p className="text-[10px] sm:text-xs text-[#9CA3AF] mt-1 truncate">No completions yet</p>
            ) : (
              <p className="text-[10px] sm:text-xs text-emerald-600 font-semibold mt-1 truncate">Keep it up!</p>
            )}
          </div>
        </div>

        {/* Card 2: Completion Rate */}
        <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7280] truncate">Completion Rate</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 tracking-tight tabular-nums">
              {weeklyCompletionRate !== null ? `${weeklyCompletionRate}%` : '—'}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#6B7280] mt-1 truncate">
              <span className={`font-semibold ${weeklyCompletionRate !== null && weeklyCompletionRate >= 80 ? 'text-emerald-600' : weeklyCompletionRate !== null && weeklyCompletionRate >= 50 ? 'text-amber-600' : 'text-[#6B7280]'}`}>
                {weeklyCompletionRate === null ? 'No scheduled items' : weeklyCompletionRate >= 80 ? 'Excellent' : weeklyCompletionRate >= 50 ? 'Good' : 'Keep going'}
              </span>
              <span>• This week</span>
            </div>
          </div>
        </div>

        {/* Card 3: Current Streak */}
        <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7280] truncate">Current Streak</span>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
              streak > 0 ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-amber-50 text-amber-600'
            }`}>
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight tabular-nums">{streak}</span>
              <span className="text-xs font-semibold text-[#6B7280]">Days</span>
            </div>
            <p className="text-[10px] sm:text-xs text-amber-600 font-medium mt-1 truncate">
              {streak >= 7 ? '🔥 Amazing consistency!' : streak > 0 ? 'Building momentum' : 'Start streak today'}
            </p>
          </div>
        </div>

        {/* Card 4: Most Productive Day */}
        <div className="card-hover-lift bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7280] truncate">Peak Day</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3">
            {totalWeeklyTasks > 0 ? (
              <>
                <span className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight truncate block">
                  {peakDayLabel}
                </span>
                <p className="text-[10px] sm:text-xs text-[#6B7280] mt-1 truncate">
                  {weeklyData[peakDayIdx]?.tasks} items completed
                </p>
              </>
            ) : (
              <>
                <span className="text-xl sm:text-2xl font-bold text-[#9CA3AF] tracking-tight">—</span>
                <p className="text-[10px] sm:text-xs text-[#6B7280] mt-1 truncate">No completed tasks yet</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MOTIVATION / INSIGHT BANNER */}
      {totalWeeklyTasks > 0 && (
        <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white border border-indigo-100 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
          <span className="text-2xl shrink-0 mt-0.5">💡</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Insight of the Week
            </span>
            <p className="text-sm font-medium text-[#111827] mt-0.5 leading-relaxed">
              {weeklyCompletionRate !== null && weeklyCompletionRate >= 80
                ? `Outstanding performance! You completed ${totalWeeklyTasks} items this week with ${weeklyCompletionRate}% completion rate. Your strongest day was ${peakDayLabel}.`
                : weeklyCompletionRate !== null && weeklyCompletionRate >= 50
                ? `Solid progress! You're at ${weeklyCompletionRate}% this week. ${peakDayLabel} was your best day with ${weeklyData[peakDayIdx]?.tasks} completions.`
                : `You're getting started! Focus on completing your top priorities each day to build momentum.`}
            </p>
          </div>
        </div>
      )}

      {/* MAIN ANALYTICS GRID (TWO COLUMNS: 65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT COLUMN: BAR CHART & ROUTINE HEATMAP (~65% / 8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-7">
          {/* 1. WEEKLY PRODUCTIVITY BAR CHART */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-[#111827]">Weekly Productivity</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Tasks & routines completed each day this week</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <span className="w-3 h-3 rounded bg-indigo-500"></span> Daily Completions
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <span className="w-3 h-3 rounded bg-purple-600"></span> Peak Day
                </span>
              </div>
            </div>

            {totalWeeklyTasks === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-slate-200" />
                <p className="text-sm font-semibold text-[#111827]">No completions yet this week</p>
                <p className="text-xs text-[#6B7280]">Complete tasks and routines to see your weekly productivity chart.</p>
              </div>
            ) : (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="day"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#111827] text-white p-3 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-slate-200">
                                {data.day}{data.tasks === weeklyData[peakDayIdx]?.tasks && data.tasks > 0 ? ' ⭐ Best Day' : ''}
                              </p>
                              <p className="font-semibold text-white mt-0.5">
                                {data.tasks} Completed
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="tasks" radius={[8, 8, 0, 0]}>
                      {weeklyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === peakDayIdx && entry.tasks > 0 ? '#7C3AED' : '#6366F1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {totalWeeklyTasks > 0
                    ? <>You finished <strong>{totalWeeklyTasks} total items</strong> this week across routine &amp; custom goals.</>
                    : 'Complete tasks and routines to build your weekly history.'}
                </span>
              </span>
              {totalWeeklyTasks > 0 && <span className="font-semibold text-indigo-600">Keep it up!</span>}
            </div>
          </div>

          {/* 3. ROUTINE CONSISTENCY HEATMAP */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#111827]">Routine Consistency</h2>
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold">
                    Last 12 Weeks
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {streak > 0 ? `${streak}-day streak` : 'No active streak'} • Routine adherence calendar
                </p>
              </div>

              {/* Intensity scale */}
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span>Less</span>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200" title="0%"></span>
                  <span className="w-3.5 h-3.5 rounded bg-indigo-200" title="1-30%"></span>
                  <span className="w-3.5 h-3.5 rounded bg-indigo-400" title="31-60%"></span>
                  <span className="w-3.5 h-3.5 rounded bg-indigo-600" title="61-85%"></span>
                  <span className="w-3.5 h-3.5 rounded bg-purple-700" title="86-100%"></span>
                </div>
                <span>More</span>
              </div>
            </div>

            {/* Matrix */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[580px] flex flex-col gap-1.5">
                <div className="grid grid-cols-12 text-left text-xs font-medium text-[#9CA3AF] pl-8 mb-1">
                  {heatmapMonthLabels.map((label, i) => (
                    <span key={i} className="col-span-4">{label}</span>
                  ))}
                </div>

                {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((dayLabel, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-2">
                    <span className="w-6 text-[11px] font-medium text-[#9CA3AF]">{dayLabel}</span>
                    <div className="grid grid-cols-12 gap-1.5 flex-1">
                      {heatmapWeeks.map((week) => {
                        const cell = week.days[rowIdx];
                        let bgClass = 'bg-slate-100 border border-slate-200';
                        if (cell.intensity === 1) bgClass = 'bg-indigo-200';
                        if (cell.intensity === 2) bgClass = 'bg-indigo-400';
                        if (cell.intensity === 3) bgClass = 'bg-indigo-600';
                        if (cell.intensity === 4) bgClass = 'bg-purple-700';

                        return (
                          <div
                            key={week.weekIdx}
                            title={`${cell.date}: ${cell.label}`}
                            className={`h-3.5 rounded-sm ${bgClass} hover:ring-2 hover:ring-indigo-400 cursor-pointer transition-all`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>
                  {streak > 0
                    ? <>Current streak: <strong>{streak} days</strong></> 
                    : 'Complete routines consistently to build a streak'}
                </span>
              </span>
              <span>Updated today</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DONUT CHART, FOCUS INSIGHTS & MILESTONES (~35% / 4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-7">
          {/* 2. TASKS BY CATEGORY DONUT CHART */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111827]">Tasks by Category</h2>
              <span className="text-xs text-[#6B7280] font-medium">{totalCatTasks} total</span>
            </div>

            {categoryData.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#9CA3AF]" />
                </div>
                <p className="text-sm font-semibold text-[#111827]">No tasks yet</p>
                <p className="text-xs text-[#6B7280]">Add tasks to see category distribution.</p>
              </div>
            ) : (
              <>
                {/* Recharts Pie Chart & Legend */}
                <div className="flex items-center gap-4 my-2">
                  <div className="relative w-32 h-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={36}
                          outerRadius={56}
                          strokeWidth={2}
                          stroke="#FFFFFF"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-[#111827]">{totalCatTasks}</span>
                      <span className="text-[10px] text-[#6B7280]">Tasks</span>
                    </div>
                  </div>

                  {topCategory && (
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-xs text-[#6B7280] font-medium">Top Category</span>
                      <span className="text-sm font-bold text-[#111827] truncate">{topCategory.name}</span>
                      <span className="text-xs text-emerald-600 font-semibold">{topCategory.value} tasks ({topCategory.pct}%)</span>
                    </div>
                  )}
                </div>

                {/* Category breakdown list */}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#E5E7EB]">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium text-[#111827]">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#111827]">{cat.pct}%</span>
                        <span className="text-[#9CA3AF]">({cat.value})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 4. FOCUS INSIGHTS */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-[#111827]">Focus Insights</h2>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs text-[#6B7280] mb-4">Your natural concentration patterns</p>

            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#6B7280] font-medium">Avg Routine Start</span>
                    <span className="text-sm font-bold text-[#111827]">{avgStartTime}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#6B7280] font-medium">Active Routines</span>
                    <span className="text-sm font-bold text-[#111827]">
                      {routines.filter((r) => r.enabled).length} of {routines.length} total
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-purple-700">
                  {routines.length > 0 ? `${Math.round((routines.filter((r) => r.enabled).length / routines.length) * 100)}%` : '—'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#6B7280] font-medium">Tasks Completed Total</span>
                    <span className="text-sm font-bold text-[#111827]">
                      {tasks.filter((t) => t.completed).length} of {tasks.length}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-[#6B7280]">
                  {tasks.length > 0
                    ? `${Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)}%`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* 5. MILESTONES */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111827]">Milestones</h2>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${streak >= 7 ? 'bg-amber-50 border-amber-200' : 'bg-[#F8FAFC] border-[#E5E7EB]'}`}>
                <span className="text-base">🔥</span>
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-semibold truncate ${streak >= 7 ? 'text-amber-700' : 'text-[#111827]'}`}>
                    7-Day Streak
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
                    {streak >= 7 ? 'Completed!' : `${streak} of 7 days`}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${tasks.filter((t) => t.completed).length >= 10 ? 'bg-emerald-50 border-emerald-200' : 'bg-[#F8FAFC] border-[#E5E7EB]'}`}>
                <span className={`text-base font-bold ${tasks.filter((t) => t.completed).length >= 10 ? 'text-emerald-600' : 'text-[#9CA3AF]'}`}>✓</span>
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-semibold truncate ${tasks.filter((t) => t.completed).length >= 10 ? 'text-[#111827]' : 'text-[#111827]'}`}>
                    10 Tasks Done
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
                    {tasks.filter((t) => t.completed).length >= 10 ? 'Completed!' : `${tasks.filter((t) => t.completed).length} of 10 tasks`}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${routines.length >= 3 ? 'bg-indigo-50 border-indigo-200' : 'bg-[#F8FAFC] border-[#E5E7EB]'}`}>
                <span className="text-base">🎯</span>
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-semibold truncate ${routines.length >= 3 ? 'text-indigo-700' : 'text-[#111827]'}`}>
                    3 Routines Set
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
                    {routines.length >= 3 ? 'Completed!' : `${routines.length} of 3 routines`}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${weeklyCompletionRate !== null && weeklyCompletionRate >= 80 ? 'bg-purple-50 border-purple-200' : 'bg-[#F8FAFC] border-[#E5E7EB]'}`}>
                <span className="text-base">⭐</span>
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-semibold truncate ${weeklyCompletionRate !== null && weeklyCompletionRate >= 80 ? 'text-purple-700' : 'text-[#111827]'}`}>
                    80% Week Rate
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
                    {weeklyCompletionRate !== null ? (weeklyCompletionRate >= 80 ? 'Completed!' : `${weeklyCompletionRate}% of 80%`) : '0% of 80%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
