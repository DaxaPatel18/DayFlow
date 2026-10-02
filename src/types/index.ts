export type Category = 'Study' | 'Coding' | 'Project' | 'Work' | 'Personal' | 'Health' | 'Other';
export type Priority = 'Low' | 'Medium' | 'High';
export type RepeatType = 'Never' | 'Daily' | 'Weekly';

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "04:00 PM"
  category: Category;
  priority: Priority;
  completed: boolean;
  completedAt?: string | null;
  repeat: RepeatType;
  isFocus?: boolean;
  createdAt: string;
}

export interface Routine {
  id: string;
  user_id?: string;
  title: string;
  time: string; // e.g. "06:30 AM"
  category: Category;
  priority: Priority;
  repeatDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  enabled: boolean;
  createdAt: string;
}

// Map of date string YYYY-MM-DD to map of routineId -> boolean
export type RoutineCompletions = Record<string, Record<string, boolean>>;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role?: string;
  avatar_url?: string;
  created_at: string;
}

export interface UserSettings {
  name: string;
  role: string;
  avatarUrl: string;
  defaultCategory: Category;
  defaultPriority: Priority;
  theme: 'light';
}

export interface DayFlowStats {
  totalTasksToday: number;
  completedToday: number;
  remainingToday: number;
  productivityPct: number;
}
