import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Heart,
  Activity,
  Sun,
  Moon,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Shield,
  HeartHandshake,
  Menu,
  X,
  Wifi,
  WifiOff,
  UserCheck,
  Building2,
  Eye
} from 'lucide-react';

export default function Header({ toggleMobileSidebar }) {
  const { user, role, activeMode, quickDemoLogin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleRoleSwitch = async (roleKey) => {
    setShowRoleMenu(false);
    await quickDemoLogin(roleKey);
    if (roleKey === 'admin') navigate('/dashboard');
    else navigate('/app/home');
  };

  const getRoleIcon = (r) => {
    switch (r) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'patient':
        return <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'caregiver':
        return <HeartHandshake className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'healthcare_worker':
      default:
        return <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
    }
  };

  const getRoleLabel = (r) => {
    switch (r) {
      case 'admin':
        return 'Healthcare Administrator';
      case 'patient':
        return 'Patient Portal';
      case 'caregiver':
        return 'Family Caregiver';
      case 'healthcare_worker':
      default:
        return 'Healthcare Worker (ASHA)';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-surface-darkcard/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          {toggleMobileSidebar && (
            <button
              onClick={toggleMobileSidebar}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/30 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  NIRANTAR
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50">
                  Continuity Platform
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block">
                Understand dropouts • Keep patients in care
              </p>
            </div>
          </Link>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* PWA Online / Offline Badge */}
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
                : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900 animate-pulse'
            }`}
            title={isOnline ? 'Central Database Connected' : 'Offline mode active - drafts cached locally'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
            <span>{isOnline ? 'Online' : 'Offline Drafts'}</span>
          </div>

          {/* Hospital & NGO Staff Switcher vs Patient Read-Only Badge */}
          {user?.role === 'patient' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/40 text-xs font-bold text-purple-900 dark:text-purple-200">
              <Eye className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Patient (Read-Only)</span>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => {
                  setShowRoleMenu(!showRoleMenu);
                  setShowUserMenu(false);
                  setShowNotifMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100/80 text-xs font-bold text-teal-900 dark:text-teal-200 transition"
                title="Hospital & NGO Operational Staff"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:inline">
                  {user?.role === 'admin' ? 'Hospital Medical Officer' : 'NGO Field Lead'}
                </span>
                <ChevronDown className="w-3 h-3 text-teal-500" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in duration-100 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Switch Staff Perspective:
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('hospital_admin')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Dr. Rajesh Verma</div>
                      <div className="text-[10px] text-slate-400">Hospital MOIC (Admin)</div>
                    </div>
                    <Shield className="w-4 h-4 text-purple-600" />
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('ngo_lead')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Sunita Devi</div>
                      <div className="text-[10px] text-slate-400">NGO Field Lead (ASHA)</div>
                    </div>
                    <HeartHandshake className="w-4 h-4 text-teal-600" />
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('hospital_nurse')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Priya Sharma</div>
                      <div className="text-[10px] text-slate-400">Hospital Staff Nurse</div>
                    </div>
                    <UserCheck className="w-4 h-4 text-sky-600" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Profile & Logout */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowRoleMenu(false);
                setShowNotifMenu(false);
              }}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs transition"
            >
              {user?.name ? user.name.charAt(0) : 'U'}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in duration-100 text-xs">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-extrabold text-slate-900 dark:text-white truncate">{user?.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-[10px] font-bold capitalize">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to="/app/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300"
                  >
                    <Heart className="w-4 h-4 text-slate-400" />
                    <span>Landing Page</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
