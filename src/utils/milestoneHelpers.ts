import { Task, Routine, RoutineCompletions } from '../types';

export interface MilestoneProgress {
  hasMilestone: boolean;
  type: 'focus' | 'routines' | 'tasks' | 'empty';
  title: string;
  subtitle: string;
  current: number;
  target: number;
  percentage: number;
}

/**
 * Calculates a real, data-driven milestone based strictly on the user's actual stored activity
 * for the given year and month (or overall activity).
 *
 * Selection Priority (Smart Milestone Selection):
 * 1. Focus Tasks: If focus-tagged tasks exist in month -> "Deep Work Progress"
 * 2. Routine Consistency: Else if routines exist and have completions -> "Routine Consistency"
 * 3. Completed Tasks: Else if tasks completed in month exist -> "Task Momentum"
 * 4. Empty State: No activity -> "No milestone yet"
 */
export function getMonthlyMilestone(
  tasks: Task[],
  routines: Routine[],
  routineCompletions: RoutineCompletions,
  year: number,
  monthIndex: number
): MilestoneProgress {
  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

  // Filter tasks belonging to the visible month
  const monthTasks = tasks.filter((t) => t.date.startsWith(monthPrefix));
  const completedMonthTasks = monthTasks.filter((t) => t.completed);

  // 1. Focus task milestone
  const focusTasks = monthTasks.filter((t) => t.isFocus);
  if (focusTasks.length > 0) {
    const completedFocus = focusTasks.filter((t) => t.completed).length;
    const totalFocus = focusTasks.length;
    const pct = Math.round((completedFocus / totalFocus) * 100);

    return {
      hasMilestone: true,
      type: 'focus',
      title: 'Deep Work Progress',
      subtitle: `${completedFocus} of ${totalFocus} focus task${totalFocus === 1 ? '' : 's'} completed`,
      current: completedFocus,
      target: totalFocus,
      percentage: pct,
    };
  }

  // 2. Routine consistency milestone
  const activeRoutines = routines.filter((r) => r.enabled);
  if (activeRoutines.length > 0) {
    // Count days in this month where at least one routine was completed
    let daysWithRoutines = 0;
    Object.entries(routineCompletions).forEach(([dateStr, compMap]) => {
      if (dateStr.startsWith(monthPrefix)) {
        const hasDone = Object.values(compMap).some(Boolean);
        if (hasDone) daysWithRoutines++;
      }
    });

    if (daysWithRoutines > 0) {
      // Dynamic milestone target based on days completed: tier up to 7, 14, 21, or total month days
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      let targetDays = 7;
      if (daysWithRoutines > 21) targetDays = daysInMonth;
      else if (daysWithRoutines > 14) targetDays = 21;
      else if (daysWithRoutines > 7) targetDays = 14;

      const pct = Math.min(100, Math.round((daysWithRoutines / targetDays) * 100));

      return {
        hasMilestone: true,
        type: 'routines',
        title: 'Routine Consistency',
        subtitle: `${daysWithRoutines} day${daysWithRoutines === 1 ? '' : 's'} with completed routines this month`,
        current: daysWithRoutines,
        target: targetDays,
        percentage: pct,
      };
    }
  }

  // 3. Completed tasks momentum milestone
  if (completedMonthTasks.length > 0) {
    const completedCount = completedMonthTasks.length;
    const totalCount = monthTasks.length;
    const pct = Math.round((completedCount / totalCount) * 100);

    return {
      hasMilestone: true,
      type: 'tasks',
      title: 'Task Momentum',
      subtitle: `${completedCount} of ${totalCount} task${totalCount === 1 ? '' : 's'} completed this month`,
      current: completedCount,
      target: totalCount,
      percentage: pct,
    };
  }

  // 4. Milestone Empty State (Requirement 5)
  return {
    hasMilestone: false,
    type: 'empty',
    title: 'No milestone yet',
    subtitle: 'Complete tasks and routines to build your first monthly milestone.',
    current: 0,
    target: 0,
    percentage: 0,
  };
}
