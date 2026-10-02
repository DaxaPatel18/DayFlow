import { Task, Routine, RoutineCompletions, UserSettings } from '../types';
import { defaultRoutines, getDefaultTasks, getDefaultRoutineCompletions, defaultSettings } from '../data/defaultData';

const BASE_TASKS_KEY = 'dayflow_tasks_v2';
const BASE_ROUTINES_KEY = 'dayflow_routines_v2';
const BASE_ROUTINE_COMPLETIONS_KEY = 'dayflow_routine_completions_v2';
const BASE_SETTINGS_KEY = 'dayflow_settings_v2';
const BASE_INITIALIZED_KEY = 'dayflow_initialized_v2';

function getKey(base: string, userId?: string): string {
  return userId ? `${base}_${userId}` : `${base}_anon`;
}

// Initialize storage for a specific user on their first login with clean empty data
export function initializeStorageIfEmpty(userId?: string, userFullName?: string, userRole?: string): void {
  if (typeof window === 'undefined') return;

  const initKey = getKey(BASE_INITIALIZED_KEY, userId);
  const tasksKey = getKey(BASE_TASKS_KEY, userId);
  const routinesKey = getKey(BASE_ROUTINES_KEY, userId);
  const completionsKey = getKey(BASE_ROUTINE_COMPLETIONS_KEY, userId);
  const settingsKey = getKey(BASE_SETTINGS_KEY, userId);

  const isInitialized = localStorage.getItem(initKey);
  if (!isInitialized) {
    if (!localStorage.getItem(tasksKey)) {
      saveTasks([], userId);
    }
    if (!localStorage.getItem(routinesKey)) {
      saveRoutines([], userId);
    }
    if (!localStorage.getItem(completionsKey)) {
      saveRoutineCompletions({}, userId);
    }
    if (!localStorage.getItem(settingsKey)) {
      saveSettings(
        {
          ...defaultSettings,
          name: userFullName || 'User',
          role: userRole || 'Student / Developer',
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            userFullName || 'User'
          )}&background=6366F1&color=fff`,
        },
        userId
      );
    }
    localStorage.setItem(initKey, 'true');
  }
}

// Tasks
export function getTasks(userId?: string): Task[] {
  if (typeof window === 'undefined') return [];
  const tasksKey = getKey(BASE_TASKS_KEY, userId);

  try {
    const raw = localStorage.getItem(tasksKey);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse tasks from localStorage', err);
    return [];
  }
}

export function saveTasks(tasks: Task[], userId?: string): void {
  if (typeof window === 'undefined') return;
  const tasksKey = getKey(BASE_TASKS_KEY, userId);
  try {
    localStorage.setItem(tasksKey, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage', err);
  }
}

// Routines
export function getRoutines(userId?: string): Routine[] {
  if (typeof window === 'undefined') return [];
  const routinesKey = getKey(BASE_ROUTINES_KEY, userId);

  try {
    const raw = localStorage.getItem(routinesKey);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse routines from localStorage', err);
    return [];
  }
}

export function saveRoutines(routines: Routine[], userId?: string): void {
  if (typeof window === 'undefined') return;
  const routinesKey = getKey(BASE_ROUTINES_KEY, userId);
  try {
    localStorage.setItem(routinesKey, JSON.stringify(routines));
  } catch (err) {
    console.error('Failed to save routines to localStorage', err);
  }
}

// Date-specific routine completions
export function getRoutineCompletions(userId?: string): RoutineCompletions {
  if (typeof window === 'undefined') return {};
  const completionsKey = getKey(BASE_ROUTINE_COMPLETIONS_KEY, userId);

  try {
    const raw = localStorage.getItem(completionsKey);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse routine completions from localStorage', err);
    return {};
  }
}

export function saveRoutineCompletions(completions: RoutineCompletions, userId?: string): void {
  if (typeof window === 'undefined') return;
  const completionsKey = getKey(BASE_ROUTINE_COMPLETIONS_KEY, userId);
  try {
    localStorage.setItem(completionsKey, JSON.stringify(completions));
  } catch (err) {
    console.error('Failed to save routine completions to localStorage', err);
  }
}

// Settings
export function getSettings(userId?: string, userFullName?: string, userRole?: string): UserSettings {
  if (typeof window === 'undefined') return defaultSettings;
  const settingsKey = getKey(BASE_SETTINGS_KEY, userId);

  try {
    const raw = localStorage.getItem(settingsKey);
    if (!raw) {
      return {
        ...defaultSettings,
        name: userFullName || 'User',
        role: userRole || 'Student / Developer',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          userFullName || 'User'
        )}&background=6366F1&color=fff`,
      };
    }
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to parse settings from localStorage', err);
    return defaultSettings;
  }
}

export function saveSettings(settings: UserSettings, userId?: string): void {
  if (typeof window === 'undefined') return;
  const settingsKey = getKey(BASE_SETTINGS_KEY, userId);
  try {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage', err);
  }
}

const BASE_IS_DEMO_KEY = 'dayflow_is_demo_v2';

export function getIsDemoData(userId?: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(getKey(BASE_IS_DEMO_KEY, userId)) === 'true';
}

export function setIsDemoData(isDemo: boolean, userId?: string): void {
  if (typeof window === 'undefined') return;
  const key = getKey(BASE_IS_DEMO_KEY, userId);
  if (isDemo) {
    localStorage.setItem(key, 'true');
  } else {
    localStorage.removeItem(key);
  }
}

// Clear all tasks and routines to an empty state for this user
export function clearAllUserData(userId?: string): void {
  if (typeof window === 'undefined') return;
  const initKey = getKey(BASE_INITIALIZED_KEY, userId);
  saveTasks([], userId);
  saveRoutines([], userId);
  saveRoutineCompletions({}, userId);
  setIsDemoData(false, userId);
  localStorage.setItem(initKey, 'true');
}

// Reset data (Clears and resets cleanly to demo for this user upon explicit user action)
export function resetAllDataToDemo(userId?: string, userFullName?: string, userRole?: string): void {
  if (typeof window === 'undefined') return;
  const seededTasks = getDefaultTasks().map((t) => ({ ...t, user_id: userId }));
  saveTasks(seededTasks, userId);
  const seededRoutines = defaultRoutines.map((r) => ({ ...r, user_id: userId }));
  saveRoutines(seededRoutines, userId);
  saveRoutineCompletions(getDefaultRoutineCompletions(), userId);
  saveSettings(
    {
      ...defaultSettings,
      name: userFullName || 'User',
      role: userRole || 'Student / Developer',
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        userFullName || 'User'
      )}&background=6366F1&color=fff`,
    },
    userId
  );
  setIsDemoData(true, userId);
  localStorage.setItem(getKey(BASE_INITIALIZED_KEY, userId), 'true');
}

