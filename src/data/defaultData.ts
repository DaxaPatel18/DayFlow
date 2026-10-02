import { Task, Routine, RoutineCompletions, UserSettings } from '../types';
import { getTodayISODate } from '../utils/dateHelpers';

export const defaultSettings: UserSettings = {
  name: 'User',
  role: 'Productivity Explorer',
  avatarUrl: 'https://ui-avatars.com/api/?name=User&background=6366F1&color=fff',
  defaultCategory: 'Coding',
  defaultPriority: 'Medium',
  theme: 'light',
};

export const defaultRoutines: Routine[] = [
  {
    id: 'rt-1',
    title: 'Wake up & freshen up',
    time: '6:30 AM',
    category: 'Health',
    priority: 'Low',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    createdAt: '2026-09-01T06:30:00.000Z',
  },
  {
    id: 'rt-2',
    title: 'Morning Exercise & Stretching',
    time: '7:15 AM',
    category: 'Health',
    priority: 'Medium',
    repeatDays: [1, 2, 3, 4, 5],
    enabled: true,
    createdAt: '2026-09-01T07:15:00.000Z',
  },
  {
    id: 'rt-3',
    title: 'Nutritious Breakfast & Hydration',
    time: '8:00 AM',
    category: 'Health',
    priority: 'Low',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'rt-4',
    title: 'Deep Focus Study / Learning Session',
    time: '9:00 AM',
    category: 'Study',
    priority: 'High',
    repeatDays: [1, 2, 3, 4, 5],
    enabled: true,
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 'rt-5',
    title: 'Solve Daily LeetCode Problem',
    time: '11:00 AM',
    category: 'Coding',
    priority: 'Medium',
    repeatDays: [1, 2, 3, 4, 5, 6],
    enabled: true,
    createdAt: '2026-09-01T11:00:00.000Z',
  },
  {
    id: 'rt-6',
    title: 'Practice SQL & Database Tuning',
    time: '2:00 PM',
    category: 'Coding',
    priority: 'Medium',
    repeatDays: [1, 3, 5],
    enabled: true,
    createdAt: '2026-09-01T14:00:00.000Z',
  },
  {
    id: 'rt-7',
    title: 'Work on Capstone Project',
    time: '4:30 PM',
    category: 'Project',
    priority: 'High',
    repeatDays: [1, 2, 3, 4, 5],
    enabled: true,
    createdAt: '2026-09-01T16:30:00.000Z',
  },
  {
    id: 'rt-8',
    title: 'Read / Technical Book',
    time: '8:00 PM',
    category: 'Study',
    priority: 'Low',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    createdAt: '2026-09-01T20:00:00.000Z',
  },
  {
    id: 'rt-9',
    title: 'Plan Tomorrow & Goal Review',
    time: '9:30 PM',
    category: 'Personal',
    priority: 'Low',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    createdAt: '2026-09-01T21:30:00.000Z',
  },
];

export function getDefaultTasks(): Task[] {
  const today = getTodayISODate();
  
  // Calculate relative dates for demo richness
  const base = new Date();
  const formatOffset = (offsetDays: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dayPlus1 = formatOffset(1);
  const dayPlus2 = formatOffset(2);
  const dayPlus3 = formatOffset(3);
  const dayPlus5 = formatOffset(5);
  const dayPlus7 = formatOffset(7);
  const dayMinus1 = formatOffset(-1);

  return [
    {
      id: 'task-1',
      title: 'Complete Machine Learning Assignment',
      description: 'Implement regularization, hyperparameter grid search, and plot confusion matrices.',
      date: today,
      time: '4:00 PM',
      category: 'Study',
      priority: 'High',
      completed: false,
      completedAt: null,
      repeat: 'Never',
      isFocus: true,
      createdAt: '2026-09-28T09:00:00.000Z',
    },
    {
      id: 'task-2',
      title: 'Prepare Slides for Tech Presentation',
      description: 'Draft the architectural diagrams and clean up performance comparison metrics.',
      date: today,
      time: '11:00 AM',
      category: 'Work',
      priority: 'High',
      completed: true,
      completedAt: '2026-09-29T10:45:00.000Z',
      repeat: 'Never',
      isFocus: false,
      createdAt: '2026-09-28T10:00:00.000Z',
    },
    {
      id: 'task-3',
      title: 'Review Cloud Infrastructure Budget',
      description: 'Audit idle Cloud SQL read replicas and verify autoscaling threshold limits.',
      date: today,
      time: '2:30 PM',
      category: 'Work',
      priority: 'Medium',
      completed: true,
      completedAt: '2026-09-29T14:15:00.000Z',
      repeat: 'Weekly',
      isFocus: false,
      createdAt: '2026-09-28T11:00:00.000Z',
    },
    {
      id: 'task-4',
      title: 'Refactor Database Schema',
      description: 'Add composite indexes on foreign keys and normalize transaction line items.',
      date: today,
      time: '1:30 PM',
      category: 'Coding',
      priority: 'High',
      completed: true,
      completedAt: '2026-09-29T13:20:00.000Z',
      repeat: 'Never',
      isFocus: false,
      createdAt: '2026-09-29T08:00:00.000Z',
    },
    {
      id: 'task-5',
      title: 'Portfolio Case Study Writeup',
      description: 'Document design choices, system architecture, and latency benchmarks.',
      date: today,
      time: '5:00 PM',
      category: 'Personal',
      priority: 'Medium',
      completed: false,
      completedAt: null,
      repeat: 'Never',
      isFocus: false,
      createdAt: '2026-09-29T08:30:00.000Z',
    },
    {
      id: 'task-6',
      title: 'Morning Wake Up Ritual',
      description: 'Hydrate 500ml water and sunlight exposure.',
      date: today,
      time: '6:30 AM',
      category: 'Health',
      priority: 'Low',
      completed: true,
      completedAt: '2026-09-29T06:40:00.000Z',
      repeat: 'Daily',
      isFocus: false,
      createdAt: '2026-09-29T06:00:00.000Z',
    },
    // Past completed task
    {
      id: 'task-7',
      title: 'System Design Deep Dive: Message Queues',
      description: 'Kafka vs RabbitMQ trade-offs for high throughput decoupled ingestion.',
      date: dayMinus1,
      time: '10:30 AM',
      category: 'Study',
      priority: 'High',
      completed: true,
      completedAt: `${dayMinus1}T11:45:00.000Z`,
      repeat: 'Never',
      isFocus: false,
      createdAt: '2026-09-27T08:00:00.000Z',
    },
    // Upcoming tasks for Calendar & Upcoming filters
    {
      id: 'task-8',
      title: 'Q4 Execution Kickoff & Strategy Call',
      description: 'Align milestones for sprint releases with engineering leads.',
      date: dayPlus1,
      time: '9:00 AM',
      category: 'Work',
      priority: 'High',
      completed: false,
      completedAt: null,
      repeat: 'Never',
      isFocus: false,
      createdAt: '2026-09-28T14:00:00.000Z',
    },
    {
      id: 'task-9',
      title: 'NLP Machine Learning Assignment Submission',
      description: 'Submit notebook and model checkpoint weights to university portal.',
      date: dayPlus2,
      time: '5:00 PM',
      category: 'Study',
      priority: 'High',
      completed: false,
      completedAt: null,
      repeat: 'Never',
      isFocus: false,
      createdAt: '2026-09-28T15:00:00.000Z',
    },
    {
      id: 'task-10',
      title: 'Data Pipeline Latency Tuning',
      description: 'Benchmark Redis caching layer for read operations.',
      date: dayPlus3,
      time: '11:30 AM',
      category: 'Coding',
      priority: 'High',
      completed: false,
      completedAt: null,
      repeat: 'Never',
      isFocus: false,
      createdAt: '2026-09-28T16:00:00.000Z',
    },
    {
      id: 'task-11',
      title: 'Client Demo Milestone Live Call',
      description: 'Demonstrate live responsive dashboard to stakeholders.',
      date: dayPlus5,
      time: '11:00 AM',
      category: 'Work',
      priority: 'High',
      completed: false,
      completedAt: null,
      repeat: 'Never',
      isFocus: false,
      createdAt: '2026-09-28T17:00:00.000Z',
    },
    {
      id: 'task-12',
      title: 'Quarterly Security Audit & Dependency Check',
      description: 'Run npm audit and update outdated vulnerable packages.',
      date: dayPlus7,
      time: '4:00 PM',
      category: 'Work',
      priority: 'Medium',
      completed: false,
      completedAt: null,
      repeat: 'Never',
      isFocus: false,
      createdAt: '2026-09-28T18:00:00.000Z',
    },
  ];
}

export function getDefaultRoutineCompletions(): RoutineCompletions {
  const today = getTodayISODate();
  return {
    [today]: {
      'rt-1': true,
      'rt-2': true,
      'rt-3': true,
      'rt-5': true,
    },
  };
}
