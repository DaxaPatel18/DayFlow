import { Category } from '../types';

export interface CategoryTheme {
  name: Category;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  chipClass: string;
  hexColor: string;
}

export function getCategoryTheme(category: Category): CategoryTheme {
  switch (category) {
    case 'Study':
      return {
        name: 'Study',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        badgeBorder: 'border-purple-200',
        dotColor: 'bg-purple-500',
        chipClass: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/70',
        hexColor: '#8B5CF6',
      };
    case 'Coding':
      return {
        name: 'Coding',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        badgeBorder: 'border-blue-200',
        dotColor: 'bg-blue-500',
        chipClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70',
        hexColor: '#3B82F6',
      };
    case 'Work':
      return {
        name: 'Work',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-200',
        dotColor: 'bg-amber-500',
        chipClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70',
        hexColor: '#F59E0B',
      };
    case 'Health':
      return {
        name: 'Health',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-200',
        dotColor: 'bg-emerald-500',
        chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70',
        hexColor: '#10B981',
      };
    case 'Personal':
      return {
        name: 'Personal',
        badgeBg: 'bg-pink-50',
        badgeText: 'text-pink-700',
        badgeBorder: 'border-pink-200',
        dotColor: 'bg-pink-500',
        chipClass: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100/70',
        hexColor: '#EC4899',
      };
    case 'Project':
      return {
        name: 'Project',
        badgeBg: 'bg-indigo-50',
        badgeText: 'text-indigo-700',
        badgeBorder: 'border-indigo-200',
        dotColor: 'bg-indigo-500',
        chipClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/70',
        hexColor: '#6366F1',
      };
    case 'Other':
    default:
      return {
        name: 'Other',
        badgeBg: 'bg-slate-50',
        badgeText: 'text-slate-700',
        badgeBorder: 'border-slate-200',
        dotColor: 'bg-slate-500',
        chipClass: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100/70',
        hexColor: '#64748B',
      };
  }
}

export function getPriorityTheme(priority: 'Low' | 'Medium' | 'High') {
  switch (priority) {
    case 'High':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        badge: 'bg-red-50 text-red-700 border-red-200',
      };
    case 'Medium':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'Low':
    default:
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
  }
}
