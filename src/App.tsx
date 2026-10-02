import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DayFlowProvider } from './context/DayFlowContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AddTaskModal } from './components/AddTaskModal';
import { AddRoutineModal } from './components/AddRoutineModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SearchModal } from './components/SearchModal';
import { Toast } from './components/Toast';

import { LoginPage } from './pages/Login';
import { SignUpPage } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';

// Conservative route-level code splitting for heavy pages
const TasksPage = lazy(() => import('./pages/Tasks').then((m) => ({ default: m.TasksPage })));
const RoutinePage = lazy(() => import('./pages/Routine').then((m) => ({ default: m.RoutinePage })));
const CalendarPage = lazy(() => import('./pages/Calendar').then((m) => ({ default: m.CalendarPage })));
const ProgressPage = lazy(() => import('./pages/Progress').then((m) => ({ default: m.ProgressPage })));
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-pulse py-4">
    <div className="flex items-center justify-between">
      <div className="h-8 w-44 bg-slate-200 rounded-xl" />
      <div className="h-9 w-28 bg-slate-200 rounded-xl" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs" />
      ))}
    </div>
    <div className="h-72 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs" />
  </div>
);

const AuthenticatedLayout: React.FC = () => {
  return (
    <ProtectedRoute>
      <DayFlowProvider>
        <div className="min-h-screen bg-[#F7F8FC] text-[#111827] flex flex-col font-sans">
          {/* Desktop Fixed Left Sidebar */}
          <Sidebar />

          {/* Fixed Top Header */}
          <Header />

          {/* Main Scrollable Content Viewport */}
          <div className="w-full pl-0 lg:pl-60 pt-16 sm:pt-20 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-12 flex-1 flex flex-col">
            <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex-1">
              <Suspense fallback={<PageLoadingFallback />}>
                <Outlet />
              </Suspense>
            </main>
          </div>

          {/* Mobile Bottom Navigation */}
          <BottomNav />

          {/* Global Interactive Modals */}
          <AddTaskModal />
          <AddRoutineModal />
          <ConfirmModal />
          <SearchModal />
          <Toast />
        </div>
      </DayFlowProvider>
    </ProtectedRoute>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Protected Dashboard Routes */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/routine" element={<RoutinePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
