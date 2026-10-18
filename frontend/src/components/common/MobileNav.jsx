import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CheckCircle2, AlertCircle, Package } from 'lucide-react';

export default function MobileNav() {
  const { activeMode } = useAuth();

  const links = [
    { to: '/app/home', label: 'Command', icon: LayoutDashboard },
    { to: '/app/patients', label: 'Patients', icon: Users },
    { to: '/app/interventions', label: 'Rescues', icon: AlertCircle },
    { to: '/app/check-in', label: 'Outreach', icon: CheckCircle2 }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-surface-darkcard/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around shadow-lg">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
