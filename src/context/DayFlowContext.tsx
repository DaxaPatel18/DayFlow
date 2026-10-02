import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Task, Routine, RoutineCompletions, UserSettings, DayFlowStats } from '../types';
import {
  initializeStorageIfEmpty,
  getTasks,
  saveTasks,
  getRoutines,
  saveRoutines,
  getRoutineCompletions,
  saveRoutineCompletions,
  getSettings,
  saveSettings,
  resetAllDataToDemo,
  clearAllUserData,
  getIsDemoData,
  setIsDemoData,
} from '../utils/storage';
import { getTodayISODate } from '../utils/dateHelpers';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { defaultRoutines, getDefaultTasks, getDefaultRoutineCompletions } from '../data/defaultData';

interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmButtonText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

interface DayFlowContextType {
  tasks: Task[];
  routines: Routine[];
  routineCompletions: RoutineCompletions;
  settings: UserSettings;
  stats: DayFlowStats;
  todayDate: string;
  // Loading & Error states
  isLoadingData: boolean;
  dataError: string | null;
  retryFetchData: () => Promise<void>;
  // Demo data tracking & actions
  isDemoData: boolean;
  loadDemoData: () => Promise<void>;
  clearDemoData: () => Promise<void>;
  // Task actions
  addTask: (data: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  setTaskAsFocus: (taskId: string) => void;
  // Routine actions
  addRoutine: (data: Omit<Routine, 'id' | 'createdAt'>) => Routine;
  updateRoutine: (routineId: string, updates: Partial<Routine>) => void;
  deleteRoutine: (routineId: string) => void;
  toggleRoutineEnabled: (routineId: string) => void;
  toggleRoutineCompletionForDate: (routineId: string, dateStr: string) => void;
  isRoutineCompletedForDate: (routineId: string, dateStr: string) => boolean;
  // Settings
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  // Modal states & helpers
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  defaultTaskDateForModal: string;
  openAddTaskModal: (initialData?: Partial<Task>) => void;
  closeTaskModal: () => void;
  isRoutineModalOpen: boolean;
  editingRoutine: Routine | null;
  openAddRoutineModal: (initialData?: Partial<Routine>) => void;
  closeRoutineModal: () => void;
  confirmModal: ConfirmModalConfig | null;
  openConfirmModal: (config: Omit<ConfirmModalConfig, 'isOpen'>) => void;
  closeConfirmModal: () => void;
  // Search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  // Notification toast
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info' | 'warning';
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const DayFlowContext = createContext<DayFlowContextType | undefined>(undefined);

export const DayFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateProfile } = useAuth();

  // Loading & error states
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isDemoData, setIsDemoDataState] = useState<boolean>(() => getIsDemoData(user?.id));

  // Instant local cache initialization to avoid UI blank flickers
  const [tasks, setTasksState] = useState<Task[]>(() => {
    if (user?.id) {
      initializeStorageIfEmpty(user.id, user.full_name, user.role);
      return getTasks(user.id);
    }
    return [];
  });

  const [routines, setRoutinesState] = useState<Routine[]>(() => (user?.id ? getRoutines(user.id) : []));
  const [routineCompletions, setRoutineCompletionsState] = useState<RoutineCompletions>(() =>
    user?.id ? getRoutineCompletions(user.id) : {}
  );
  const [settings, setSettingsState] = useState<UserSettings>(() =>
    getSettings(user?.id, user?.full_name, user?.role)
  );

  const todayDate = useMemo(() => getTodayISODate(), []);

  // UI state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskDateForModal, setDefaultTaskDateForModal] = useState<string>(todayDate);

  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  // Sync state modifications to cache
  const updateTasksLocal = (newTasks: Task[]) => {
    setTasksState(newTasks);
    saveTasks(newTasks, user?.id);
  };

  const updateRoutinesLocal = (newRoutines: Routine[]) => {
    setRoutinesState(newRoutines);
    saveRoutines(newRoutines, user?.id);
  };

  const updateRoutineCompletionsLocal = (newCompletions: RoutineCompletions) => {
    setRoutineCompletionsState(newCompletions);
    saveRoutineCompletions(newCompletions, user?.id);
  };

  // ASYNC SUPABASE SYNC LAYER: Read from Supabase when user is authenticated
  useEffect(() => {
    let isCancelled = false;

    if (!user?.id) {
      setTasksState([]);
      setRoutinesState([]);
      setRoutineCompletionsState({});
      setSettingsState(getSettings());
      setIsLoadingData(false);
      setDataError(null);
      setIsDemoDataState(false);
      return;
    }

    const userId = user.id;
    const userFullName = user.full_name;
    const userRole = user.role;

    // Load local cache immediately
    initializeStorageIfEmpty(userId, userFullName, userRole);
    const localTasks = getTasks(userId);
    const localRoutines = getRoutines(userId);
    const localCompletions = getRoutineCompletions(userId);
    const localSettings = getSettings(userId, userFullName, userRole);

    setTasksState(localTasks);
    setRoutinesState(localRoutines);
    setRoutineCompletionsState(localCompletions);
    setSettingsState(localSettings);
    setIsDemoDataState(getIsDemoData(userId));

    async function syncFromSupabase() {
      setIsLoadingData(true);
      setDataError(null);
      try {
        // 1. Fetch user profile from Supabase
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!isCancelled) {
          if (profileData) {
            const syncedSettings: UserSettings = {
              ...localSettings,
              name: profileData.full_name || userFullName || 'User',
              role: profileData.role || userRole || 'Student / Developer',
              avatarUrl: profileData.avatar_url || '',
            };
            setSettingsState(syncedSettings);
            saveSettings(syncedSettings, userId);
          } else {
            // Profile does not exist yet, insert user profile safely
            try {
              await supabase.from('profiles').upsert({
                id: userId,
                email: user?.email || '',
                full_name: userFullName || user?.email?.split('@')[0] || 'User',
                role: userRole || 'Student / Developer',
                avatar_url: '',
              });
            } catch (pErr) {
              console.warn('Initial profile upsert notice:', pErr);
            }
          }
        }

        // 2. Fetch tasks from Supabase (Source of Truth)
        const { data: remoteTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!tasksError && remoteTasks) {
          const mappedTasks: Task[] = remoteTasks.map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            title: row.title,
            description: row.description || '',
            date: row.date,
            time: row.time,
            category: row.category,
            priority: row.priority,
            completed: !!row.completed,
            completedAt: row.completed_at || null,
            repeat: row.repeat || 'Never',
            isFocus: !!row.is_focus,
            createdAt: row.created_at || new Date().toISOString(),
          }));
          if (!isCancelled) {
            setTasksState(mappedTasks);
            saveTasks(mappedTasks, userId);
          }
        }

        // 3. Fetch routines from Supabase (Source of Truth)
        const { data: remoteRoutines, error: routinesError } = await supabase
          .from('routines')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (!routinesError && remoteRoutines) {
          const mappedRoutines: Routine[] = remoteRoutines.map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            title: row.title,
            time: row.time,
            category: row.category,
            priority: row.priority,
            repeatDays: Array.isArray(row.repeat_days) ? row.repeat_days : [0, 1, 2, 3, 4, 5, 6],
            enabled: row.enabled !== false,
            createdAt: row.created_at || new Date().toISOString(),
          }));
          if (!isCancelled) {
            setRoutinesState(mappedRoutines);
            saveRoutines(mappedRoutines, userId);
          }
        }

        // 4. Fetch routine completions from Supabase (Source of Truth)
        const { data: remoteCompletions, error: compError } = await supabase
          .from('routine_completions')
          .select('*')
          .eq('user_id', userId);

        if (!compError && remoteCompletions) {
          const mappedCompletions: RoutineCompletions = {};
          for (const rc of remoteCompletions) {
            if (!mappedCompletions[rc.date]) {
              mappedCompletions[rc.date] = {};
            }
            mappedCompletions[rc.date][rc.routine_id] = !!rc.completed;
          }
          if (!isCancelled) {
            setRoutineCompletionsState(mappedCompletions);
            saveRoutineCompletions(mappedCompletions, userId);
          }
        }

        if (!isCancelled) {
          setIsLoadingData(false);
          setDataError(null);
        }
      } catch (err) {
        console.warn('Supabase initial fetch fallback to local cache:', err);
        if (!isCancelled) {
          setIsLoadingData(false);
          if (localTasks.length === 0 && localRoutines.length === 0) {
            setDataError("Couldn't load your productivity data. Try again.");
          }
        }
      }
    }

    syncFromSupabase();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, user?.full_name, user?.role]);

  const retryFetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingData(true);
    setDataError(null);
    try {
      const { data: remoteTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const mappedTasks: Task[] = (remoteTasks || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        description: row.description || '',
        date: row.date,
        time: row.time,
        category: row.category,
        priority: row.priority,
        completed: !!row.completed,
        completedAt: row.completed_at || null,
        repeat: row.repeat || 'Never',
        isFocus: !!row.is_focus,
        createdAt: row.created_at || new Date().toISOString(),
      }));
      setTasksState(mappedTasks);
      saveTasks(mappedTasks, user.id);

      const { data: remoteRoutines, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (routinesError) throw routinesError;

      const mappedRoutines: Routine[] = (remoteRoutines || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        time: row.time,
        category: row.category,
        priority: row.priority,
        repeatDays: Array.isArray(row.repeat_days) ? row.repeat_days : [0, 1, 2, 3, 4, 5, 6],
        enabled: row.enabled !== false,
        createdAt: row.created_at || new Date().toISOString(),
      }));
      setRoutinesState(mappedRoutines);
      saveRoutines(mappedRoutines, user.id);

      const { data: remoteCompletions } = await supabase
        .from('routine_completions')
        .select('*')
        .eq('user_id', user.id);

      const mappedCompletions: RoutineCompletions = {};
      if (remoteCompletions) {
        for (const rc of remoteCompletions) {
          if (!mappedCompletions[rc.date]) mappedCompletions[rc.date] = {};
          mappedCompletions[rc.date][rc.routine_id] = !!rc.completed;
        }
      }
      setRoutineCompletionsState(mappedCompletions);
      saveRoutineCompletions(mappedCompletions, user.id);

      setIsLoadingData(false);
      setDataError(null);
    } catch {
      setDataError("Couldn't load your productivity data. Try again.");
      setIsLoadingData(false);
    }
  }, [user?.id]);

  // Calculate stats for today
  const stats = useMemo<DayFlowStats>(() => {
    const todayDayOfWeek = new Date().getDay();
    const tasksForToday = tasks.filter((t) => t.date === todayDate);
    const completedTasksToday = tasksForToday.filter((t) => t.completed).length;

    const routinesForToday = routines.filter((r) => r.enabled && r.repeatDays.includes(todayDayOfWeek));
    const todayCompletions = routineCompletions[todayDate] || {};
    const completedRoutinesToday = routinesForToday.filter((r) => todayCompletions[r.id]).length;

    const totalTasksToday = tasksForToday.length + routinesForToday.length;
    const completedToday = completedTasksToday + completedRoutinesToday;
    const remainingToday = Math.max(0, totalTasksToday - completedToday);
    const productivityPct = totalTasksToday > 0 ? Math.round((completedToday / totalTasksToday) * 100) : 0;

    return {
      totalTasksToday,
      completedToday,
      remainingToday,
      productivityPct,
    };
  }, [tasks, routines, routineCompletions, todayDate]);

  // Task actions
  const addTask = (data: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...data,
      user_id: user?.id,
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };

    let updatedTasks = tasks;
    if (newTask.isFocus) {
      updatedTasks = updatedTasks.map((t) => ({ ...t, isFocus: false }));
    }

    const nextTasks = [newTask, ...updatedTasks];
    updateTasksLocal(nextTasks);
    showToast(`Task "${newTask.title}" added`);

    // Write to Supabase
    if (user?.id) {
      (async () => {
        try {
          if (newTask.isFocus) {
            await supabase.from('tasks').update({ is_focus: false }).eq('user_id', user.id);
          }
          await supabase.from('tasks').insert({
            id: newTask.id,
            user_id: user.id,
            title: newTask.title,
            description: newTask.description || '',
            date: newTask.date,
            time: newTask.time,
            category: newTask.category,
            priority: newTask.priority,
            completed: newTask.completed,
            completed_at: newTask.completedAt || null,
            repeat: newTask.repeat,
            is_focus: !!newTask.isFocus,
            created_at: newTask.createdAt,
          });
        } catch (e) {
          console.error('Supabase addTask error:', e);
        }
      })();
    }

    return newTask;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const nextTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, ...updates };
      }
      if (updates.isFocus && t.id !== taskId) {
        return { ...t, isFocus: false };
      }
      return t;
    });
    updateTasksLocal(nextTasks);
    showToast('Task updated successfully');

    if (user?.id) {
      (async () => {
        try {
          if (updates.isFocus) {
            await supabase.from('tasks').update({ is_focus: false }).eq('user_id', user.id);
          }

          const mapped: any = {};
          if (updates.title !== undefined) mapped.title = updates.title;
          if (updates.description !== undefined) mapped.description = updates.description;
          if (updates.date !== undefined) mapped.date = updates.date;
          if (updates.time !== undefined) mapped.time = updates.time;
          if (updates.category !== undefined) mapped.category = updates.category;
          if (updates.priority !== undefined) mapped.priority = updates.priority;
          if (updates.completed !== undefined) mapped.completed = updates.completed;
          if (updates.completedAt !== undefined) mapped.completed_at = updates.completedAt;
          if (updates.repeat !== undefined) mapped.repeat = updates.repeat;
          if (updates.isFocus !== undefined) mapped.is_focus = updates.isFocus;

          await supabase.from('tasks').update(mapped).eq('id', taskId).eq('user_id', user.id);
        } catch (e) {
          console.error('Supabase updateTask error:', e);
        }
      })();
    }
  };

  const deleteTask = (taskId: string) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    const nextTasks = tasks.filter((t) => t.id !== taskId);
    updateTasksLocal(nextTasks);
    showToast(`Task "${taskToDelete?.title || ''}" deleted`);

    if (user?.id) {
      (async () => {
        try {
          await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', user.id);
        } catch (e) {
          console.error('Supabase deleteTask error:', e);
        }
      })();
    }
  };

  const toggleTaskComplete = (taskId: string) => {
    let nextCompleted = false;
    let completedAtVal: string | null = null;

    const nextTasks = tasks.map((t) => {
      if (t.id === taskId) {
        nextCompleted = !t.completed;
        completedAtVal = nextCompleted ? new Date().toISOString() : null;
        if (nextCompleted) {
          const todayTasksList = nextTasks.filter((t) => t.date === todayDate);
          const allTodayDone = todayTasksList.length > 0 && todayTasksList.every((t) => t.completed);
          if (allTodayDone) {
            try {
              confetti({
                particleCount: 45,
                spread: 70,
                origin: { y: 0.7 },
                colors: ['#6366F1', '#8B5CF6', '#22C55E', '#F59E0B'],
              });
            } catch {
              // ignore in non-browser
            }
          }
        }
        return {
          ...t,
          completed: nextCompleted,
          completedAt: completedAtVal,
        };
      }
      return t;
    });

    updateTasksLocal(nextTasks);

    if (user?.id) {
      (async () => {
        try {
          await supabase.from('tasks').update({
            completed: nextCompleted,
            completed_at: completedAtVal,
          }).eq('id', taskId).eq('user_id', user.id);
        } catch (e) {
          console.error('Supabase toggleTaskComplete error:', e);
        }
      })();
    }
  };

  const setTaskAsFocus = (taskId: string) => {
    const nextTasks = tasks.map((t) => ({
      ...t,
      isFocus: t.id === taskId,
    }));
    updateTasksLocal(nextTasks);
    const found = nextTasks.find((t) => t.id === taskId);
    if (found) {
      showToast(`Set "${found.title}" as Today's Focus`);
    }

    if (user?.id) {
      (async () => {
        try {
          await supabase.from('tasks').update({ is_focus: false }).eq('user_id', user.id);
          await supabase.from('tasks').update({ is_focus: true }).eq('id', taskId).eq('user_id', user.id);
        } catch (e) {
          console.error('Supabase setTaskAsFocus error:', e);
        }
      })();
    }
  };

  // Routine actions
  const addRoutine = (data: Omit<Routine, 'id' | 'createdAt'>): Routine => {
    const newRoutine: Routine = {
      ...data,
      user_id: user?.id,
      id: 'rt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    const nextRoutines = [...routines, newRoutine];
    updateRoutinesLocal(nextRoutines);
    showToast(`Routine "${newRoutine.title}" created`);

    if (user?.id) {
      (async () => {
        try {
          await supabase.from('routines').insert({
            id: newRoutine.id,
            user_id: user.id,
            title: newRoutine.title,
            time: newRoutine.time,
            category: newRoutine.category,
            priority: newRoutine.priority,
            repeat_days: newRoutine.repeatDays,
            enabled: newRoutine.enabled,
            created_at: newRoutine.createdAt,
          });
        } catch (e) {
          console.error('Supabase addRoutine error:', e);
        }
      })();
    }

    return newRoutine;
  };

  const updateRoutine = (routineId: string, updates: Partial<Routine>) => {
    const nextRoutines = routines.map((r) => (r.id === routineId ? { ...r, ...updates } : r));
    updateRoutinesLocal(nextRoutines);
    showToast('Routine updated');

    if (user?.id) {
      (async () => {
        try {
          const mapped: any = {};
          if (updates.title !== undefined) mapped.title = updates.title;
          if (updates.time !== undefined) mapped.time = updates.time;
          if (updates.category !== undefined) mapped.category = updates.category;
          if (updates.priority !== undefined) mapped.priority = updates.priority;
          if (updates.repeatDays !== undefined) mapped.repeat_days = updates.repeatDays;
          if (updates.enabled !== undefined) mapped.enabled = updates.enabled;

          await supabase.from('routines').update(mapped).eq('id', routineId).eq('user_id', user.id);
        } catch (e) {
          console.error('Supabase updateRoutine error:', e);
        }
      })();
    }
  };

  const deleteRoutine = (routineId: string) => {
    const target = routines.find((r) => r.id === routineId);
    const nextRoutines = routines.filter((r) => r.id !== routineId);
    updateRoutinesLocal(nextRoutines);
    showToast(`Routine "${target?.title || ''}" deleted`);

    if (user?.id) {
      (async () => {
        try {
          await supabase.from('routines').delete().eq('id', routineId).eq('user_id', user.id);
          await supabase.from('routine_completions').delete().eq('routine_id', routineId).eq('user_id', user.id);
        } catch (e) {
          console.error('Supabase deleteRoutine error:', e);
        }
      })();
    }
  };

  const toggleRoutineEnabled = (routineId: string) => {
    let nextEnabled = true;
    const nextRoutines = routines.map((r) => {
      if (r.id === routineId) {
        nextEnabled = !r.enabled;
        return { ...r, enabled: nextEnabled };
      }
      return r;
    });
    updateRoutinesLocal(nextRoutines);

    if (user?.id) {
      (async () => {
        try {
          await supabase.from('routines').update({ enabled: nextEnabled }).eq('id', routineId).eq('user_id', user.id);
        } catch (e) {
          console.error('Supabase toggleRoutineEnabled error:', e);
        }
      })();
    }
  };

  const toggleRoutineCompletionForDate = (routineId: string, dateStr: string) => {
    const currentForDate = routineCompletions[dateStr] || {};
    const isCurrentlyDone = !!currentForDate[routineId];
    const nextCompletions = {
      ...routineCompletions,
      [dateStr]: {
        ...currentForDate,
        [routineId]: !isCurrentlyDone,
      },
    };
    updateRoutineCompletionsLocal(nextCompletions);



    if (user?.id) {
      (async () => {
        try {
          if (!isCurrentlyDone) {
            await supabase.from('routine_completions').upsert({
              id: `${user.id}_${routineId}_${dateStr}`,
              user_id: user.id,
              routine_id: routineId,
              date: dateStr,
              completed: true,
              created_at: new Date().toISOString(),
            });
          } else {
            await supabase
              .from('routine_completions')
              .delete()
              .eq('user_id', user.id)
              .eq('routine_id', routineId)
              .eq('date', dateStr);
          }
        } catch (e) {
          console.error('Supabase toggleRoutineCompletion error:', e);
        }
      })();
    }
  };

  const isRoutineCompletedForDate = (routineId: string, dateStr: string): boolean => {
    return !!(routineCompletions[dateStr] && routineCompletions[dateStr][routineId]);
  };

  // Settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettingsState(merged);
    saveSettings(merged, user?.id);

    if (user?.id) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: merged.name,
          role: merged.role,
          avatar_url: merged.avatarUrl,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Supabase update profile error:', e);
      }
    }

    if (newSettings.name || newSettings.role || newSettings.avatarUrl !== undefined) {
      await updateProfile({
        full_name: newSettings.name,
        role: newSettings.role,
        avatar_url: newSettings.avatarUrl,
      });
    }

    showToast('Settings saved');
  };

  const resetAllData = async () => {
    const userId = user?.id;
    if (userId) {
      try {
        await supabase.from('tasks').delete().eq('user_id', userId);
        await supabase.from('routines').delete().eq('user_id', userId);
        await supabase.from('routine_completions').delete().eq('user_id', userId);
      } catch (e) {
        console.error('Supabase clear during reset error:', e);
      }
    }

    resetAllDataToDemo(userId, user?.full_name, user?.role);

    const freshTasks = getTasks(userId);
    const freshRoutines = getRoutines(userId);
    const freshCompletions = getRoutineCompletions(userId);

    setTasksState(freshTasks);
    setRoutinesState(freshRoutines);
    setRoutineCompletionsState(freshCompletions);
    setSettingsState(getSettings(userId, user?.full_name, user?.role));

    // Re-seed to Supabase
    if (userId) {
      try {
        const tasksToInsert = freshTasks.map((t) => ({
          id: t.id,
          user_id: userId,
          title: t.title,
          description: t.description || '',
          date: t.date,
          time: t.time,
          category: t.category,
          priority: t.priority,
          completed: t.completed,
          completed_at: t.completedAt || null,
          repeat: t.repeat,
          is_focus: !!t.isFocus,
          created_at: t.createdAt,
        }));
        await supabase.from('tasks').insert(tasksToInsert);

        const routinesToInsert = freshRoutines.map((r) => ({
          id: r.id,
          user_id: userId,
          title: r.title,
          time: r.time,
          category: r.category,
          priority: r.priority,
          repeat_days: r.repeatDays,
          enabled: r.enabled,
          created_at: r.createdAt,
        }));
        await supabase.from('routines').insert(routinesToInsert);

        const compToInsert: any[] = [];
        Object.entries(freshCompletions).forEach(([date, rec]) => {
          Object.entries(rec).forEach(([routineId, done]) => {
            if (done) {
              compToInsert.push({
                id: `${userId}_${routineId}_${date}`,
                user_id: userId,
                routine_id: routineId,
                date,
                completed: true,
                created_at: new Date().toISOString(),
              });
            }
          });
        });
        if (compToInsert.length > 0) {
          await supabase.from('routine_completions').upsert(compToInsert);
        }
      } catch (e) {
        console.error('Supabase re-seed error:', e);
      }
    }

    if (userId) {
      setIsDemoData(true, userId);
    }
    setIsDemoDataState(true);
    showToast('Loaded sample demonstration data');
  };

  const clearAllData = async () => {
    const userId = user?.id;
    if (userId) {
      try {
        await supabase.from('tasks').delete().eq('user_id', userId);
        await supabase.from('routines').delete().eq('user_id', userId);
        await supabase.from('routine_completions').delete().eq('user_id', userId);
      } catch (e) {
        console.error('Supabase clearAllData error:', e);
      }
      setIsDemoData(false, userId);
    }

    clearAllUserData(userId);
    setTasksState([]);
    setRoutinesState([]);
    setRoutineCompletionsState({});
    setIsDemoDataState(false);
    showToast('Cleared all tasks and routines');
  };

  const loadDemoData = async () => {
    await resetAllData();
  };

  const clearDemoData = async () => {
    await clearAllData();
  };

  // Modals
  const openAddTaskModal = (initialData?: Partial<Task>) => {
    if (initialData?.id) {
      const existing = tasks.find((t) => t.id === initialData.id);
      if (existing) {
        setEditingTask(existing);
        setDefaultTaskDateForModal(existing.date);
      }
    } else {
      setEditingTask(null);
      setDefaultTaskDateForModal(initialData?.date || todayDate);
    }
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const openAddRoutineModal = (initialData?: Partial<Routine>) => {
    if (initialData?.id) {
      const existing = routines.find((r) => r.id === initialData.id);
      if (existing) {
        setEditingRoutine(existing);
      }
    } else {
      setEditingRoutine(null);
    }
    setIsRoutineModalOpen(true);
  };

  const closeRoutineModal = () => {
    setIsRoutineModalOpen(false);
    setEditingRoutine(null);
  };

  const openConfirmModal = (config: Omit<ConfirmModalConfig, 'isOpen'>) => {
    setConfirmModal({ ...config, isOpen: true });
  };

  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  return (
    <DayFlowContext.Provider
      value={{
        tasks,
        routines,
        routineCompletions,
        settings,
        stats,
        todayDate,
        isLoadingData,
        dataError,
        retryFetchData,
        isDemoData,
        loadDemoData,
        clearDemoData,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        setTaskAsFocus,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        toggleRoutineEnabled,
        toggleRoutineCompletionForDate,
        isRoutineCompletedForDate,
        updateSettings,
        resetAllData,
        clearAllData,
        isTaskModalOpen,
        editingTask,
        defaultTaskDateForModal,
        openAddTaskModal,
        closeTaskModal,
        isRoutineModalOpen,
        editingRoutine,
        openAddRoutineModal,
        closeRoutineModal,
        confirmModal,
        openConfirmModal,
        closeConfirmModal,
        isSearchOpen,
        setIsSearchOpen,
        globalSearchQuery,
        setGlobalSearchQuery,
        toastMessage,
        toastType,
        showToast,
      }}
    >
      {children}
    </DayFlowContext.Provider>
  );
};

export const useDayFlow = (): DayFlowContextType => {
  const context = useContext(DayFlowContext);
  if (!context) {
    throw new Error('useDayFlow must be used within a DayFlowProvider');
  }
  return context;
};
