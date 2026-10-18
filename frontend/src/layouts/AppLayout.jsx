import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import MobileNav from '../components/common/MobileNav';
import WorkerAssistantDrawer from '../components/common/WorkerAssistantDrawer';
import { useNotifications } from '../context/NotificationContext';
import { Bot, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const { toasts } = useNotifications();

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col transition-colors">
      
      {/* Top sticky header */}
      <Header toggleMobileSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main App Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Responsive Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenAiAssistant={() => setAssistantOpen(true)}
        />

        {/* Main Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-20 md:pb-8">
          <Outlet />
        </main>

      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* AI Assistant Floating Button (Desktop) */}
      <div className="fixed bottom-6 right-6 z-30 hidden md:block">
        <button
          onClick={() => setAssistantOpen(true)}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-700 to-teal-800 hover:from-brand-800 hover:to-teal-900 text-white shadow-xl shadow-brand-700/30 flex items-center gap-2 font-bold text-xs hover:scale-105 transition-all"
          title="Open AI Clinical Assistant"
        >
          <Bot className="w-5 h-5 text-brand-200" />
          <span>Ask Nirantar AI</span>
        </button>
      </div>

      {/* Worker Assistant Drawer */}
      <WorkerAssistantDrawer
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />

      {/* Floating Toast Alerts Container */}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 max-w-sm text-xs animate-in slide-in-from-top duration-150 ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900'
                : toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900'
                : 'bg-white text-slate-900 border-slate-200 dark:bg-surface-darkcard dark:text-slate-100 dark:border-slate-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            ) : toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 font-medium">{toast.message}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
