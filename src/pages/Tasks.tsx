import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Calendar as CalendarIcon,
  Flame,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useDayFlow } from '../context/DayFlowContext';
import { Task, Category, Priority } from '../types';
import { TaskCard } from '../components/TaskCard';
import { isDateToday, isDateUpcoming, isDateThisWeek } from '../utils/dateHelpers';

type TabType = 'All' | 'Today' | 'Upcoming' | 'Completed';
type SortType = 'date' | 'priority' | 'title' | 'created';

export const TasksPage: React.FC = () => {
  const { tasks, todayDate, openAddTaskModal } = useDayFlow();

  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortType>('date');

  // Filter tasks based on tabs, search, category, and priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === 'Today') {
        if (!isDateToday(task.date)) return false;
      } else if (activeTab === 'Upcoming') {
        if (!isDateUpcoming(task.date) || task.completed) return false;
      } else if (activeTab === 'Completed') {
        if (!task.completed) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesCat = task.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && task.category !== selectedCategory) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'All' && task.priority !== selectedPriority) {
        return false;
      }

      return true;
    });
  }, [tasks, activeTab, searchQuery, selectedCategory, selectedPriority]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    const priorityWeight: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };

    list.sort((a, b) => {
      if (sortBy === 'priority') {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // default: by date
      return a.date.localeCompare(b.date);
    });

    return list;
  }, [filteredTasks, sortBy]);

  // Groupings for structured section display
  const highPriorityGroup = sortedTasks.filter((t) => !t.completed && t.priority === 'High');
  const todayInProgressGroup = sortedTasks.filter(
    (t) => !t.completed && t.priority !== 'High' && isDateToday(t.date)
  );
  const laterThisWeekGroup = sortedTasks.filter(
    (t) => !t.completed && t.priority !== 'High' && !isDateToday(t.date) && isDateThisWeek(t.date)
  );
  const otherUpcomingGroup = sortedTasks.filter(
    (t) => !t.completed && t.priority !== 'High' && !isDateToday(t.date) && !isDateThisWeek(t.date)
  );
  const completedGroup = sortedTasks.filter((t) => t.completed);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'All', label: 'All', count: tasks.length },
    { key: 'Today', label: 'Today', count: tasks.filter((t) => isDateToday(t.date)).length },
    {
      key: 'Upcoming',
      label: 'Upcoming',
      count: tasks.filter((t) => !t.completed && isDateUpcoming(t.date)).length,
    },
    { key: 'Completed', label: 'Completed', count: tasks.filter((t) => t.completed).length },
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">MY WORKSPACE</span>
            <span className="text-[#D1D5DB]">›</span>
            <span className="text-xs text-[#6B7280] font-medium">Task Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">My Tasks</h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Organize, prioritize, and track your personalized day-to-day actions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAddTaskModal()}
          className="flex items-center justify-center gap-2 h-10 sm:h-11 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* TABS & FILTERS BAR */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5 bg-white border border-[#E5E7EB] rounded-2xl p-3 sm:p-4 shadow-2xs">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto scrollbar-none max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[36px] ${
                activeTab === tab.key
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                  activeTab === tab.key
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'bg-slate-200 text-[#4B5563]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Select Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full xl:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-56 md:w-64 shrink-0">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs sm:text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-[#4B5563] flex items-center justify-center text-xs transition-colors cursor-pointer"
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          {/* Responsive Filters Grid */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors w-full sm:w-auto cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Study">Study</option>
              <option value="Coding">Coding</option>
              <option value="Project">Project</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors w-full sm:w-auto cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            {/* Sort Dropdown */}
            <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-start gap-1.5 h-10 px-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs sm:text-sm text-[#111827] w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                <span className="text-[#6B7280] sm:hidden text-xs">Sort:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="bg-transparent focus:outline-none text-xs sm:text-sm text-[#111827] cursor-pointer flex-1 sm:flex-initial text-right sm:text-left"
              >
                <option value="date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title (A-Z)</option>
                <option value="created">Recently Added</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TASK LIST OR GROUPS */}
      {sortedTasks.length === 0 ? (
        <div className="py-20 px-6 text-center bg-white border border-[#E5E7EB] rounded-2xl flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-500 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <h3 className="font-bold text-base text-[#111827]">No tasks found</h3>
          <p className="text-xs text-[#6B7280] mt-1.5 max-w-xs leading-relaxed">
            {searchQuery || selectedCategory !== 'All' || selectedPriority !== 'All'
              ? 'Try adjusting your search criteria or clearing your filters.'
              : 'Your task queue is clear. Add your first task to start building momentum.'}
          </p>
          {!searchQuery && selectedCategory === 'All' && selectedPriority === 'All' && (
            <button
              type="button"
              onClick={() => openAddTaskModal()}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Task
            </button>
          )}
        </div>
      ) : activeTab !== 'All' ? (
        // Plain list for filtered tab
        <div className="flex flex-col gap-2.5">
          {sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} showDate={true} />
          ))}
        </div>
      ) : (
        // Structured groups for 'All' tab
        <div className="flex flex-col gap-7">
          {/* 1. High Priority & Urgent */}
          {highPriorityGroup.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  High Priority & Urgent
                </span>
                <span className="text-xs font-medium text-[#6B7280]">
                  {highPriorityGroup.length} {highPriorityGroup.length === 1 ? 'task' : 'tasks'}
                </span>
                <div className="flex-1 border-t border-[#E5E7EB]" />
              </div>
              <div className="flex flex-col gap-2.5">
                {highPriorityGroup.map((task) => (
                  <TaskCard key={task.id} task={task} showDate={true} />
                ))}
              </div>
            </div>
          )}

          {/* 2. In Progress Today */}
          {todayInProgressGroup.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Today's Queue
                </span>
                <span className="text-xs font-medium text-[#6B7280]">
                  {todayInProgressGroup.length} {todayInProgressGroup.length === 1 ? 'task' : 'tasks'}
                </span>
                <div className="flex-1 border-t border-[#E5E7EB]" />
              </div>
              <div className="flex flex-col gap-2.5">
                {todayInProgressGroup.map((task) => (
                  <TaskCard key={task.id} task={task} showDate={true} />
                ))}
              </div>
            </div>
          )}

          {/* 3. Scheduled Later This Week */}
          {laterThisWeekGroup.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Later This Week
                </span>
                <span className="text-xs font-medium text-[#6B7280]">
                  {laterThisWeekGroup.length} {laterThisWeekGroup.length === 1 ? 'task' : 'tasks'}
                </span>
                <div className="flex-1 border-t border-[#E5E7EB]" />
              </div>
              <div className="flex flex-col gap-2.5">
                {laterThisWeekGroup.map((task) => (
                  <TaskCard key={task.id} task={task} showDate={true} />
                ))}
              </div>
            </div>
          )}

          {/* 4. Other Upcoming */}
          {otherUpcomingGroup.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[#4B5563] text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Upcoming Later
                </span>
                <span className="text-xs font-medium text-[#6B7280]">
                  {otherUpcomingGroup.length} {otherUpcomingGroup.length === 1 ? 'task' : 'tasks'}
                </span>
                <div className="flex-1 border-t border-[#E5E7EB]" />
              </div>
              <div className="flex flex-col gap-2.5">
                {otherUpcomingGroup.map((task) => (
                  <TaskCard key={task.id} task={task} showDate={true} />
                ))}
              </div>
            </div>
          )}

          {/* 5. Completed Tasks */}
          {completedGroup.length > 0 && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Completed
                </span>
                <span className="text-xs font-medium text-[#6B7280]">
                  {completedGroup.length} {completedGroup.length === 1 ? 'task' : 'tasks'}
                </span>
                <div className="flex-1 border-t border-[#E5E7EB]" />
              </div>
              <div className="flex flex-col gap-2.5">
                {completedGroup.map((task) => (
                  <TaskCard key={task.id} task={task} showDate={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
