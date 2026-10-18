import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Clock,
  Smartphone,
  Layers,
  MapPin,
  PieChart,
  Award,
  Settings,
  ShieldAlert,
  Heart,
  Bot
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, onOpenAiAssistant }) {
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';

  const getLinks = () => {
    if (isPatient) {
      return [
        { to: '/app/home', label: 'My Treatment Schedule', icon: LayoutDashboard, exact: true },
        { to: '/app/patient-portal', label: 'Prescription & Regimen', icon: Heart }
      ];
    }

    return [
      { to: '/app/home', label: 'Operations Command Center', icon: LayoutDashboard, exact: true },
      { to: '/app/patients', label: 'Patient Registry & Risk', icon: Users },
      { to: '/app/interventions', label: 'Rescue Interventions Queue', icon: Clock },
      { to: '/app/check-in', label: 'Record Outreach & Barrier', icon: CheckCircle2 },
      { to: '/dashboard/hotspots', label: 'Catchment Area Map', icon: MapPin },
      { to: '/dashboard/dropout-reasons', label: 'Barrier Intelligence', icon: PieChart },
      { to: '/dashboard/effectiveness', label: '"What Works" Learning Engine', icon: Award },
      { to: '/dashboard/inventory', label: 'Hospital Medicine Stock', icon: Layers },
      { to: '/app/communications', label: 'SMS & IVR Outreach', icon: Smartphone },
      { to: '/dashboard/audit-logs', label: 'Clinical Audit Trail', icon: ShieldAlert }
    ];
  };

  const navLinks = getLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-surface-darkcard border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Active Scope indicator */}
          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              {isPatient ? 'Patient Portal' : 'Operational Scope'}
            </span>
            <p className="text-xs font-bold text-teal-950 dark:text-teal-100 truncate mt-0.5">
              {isPatient ? 'Read-Only Access' : 'Hospital & NGO Collaborative'}
            </p>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* AI Assistant Pill in Footer (Hospital & NGO only) */}
        {!isPatient && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onOpenAiAssistant}
              className="w-full p-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Bot className="w-4 h-4 text-teal-300" />
              <span>Ask Nirantar AI</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
