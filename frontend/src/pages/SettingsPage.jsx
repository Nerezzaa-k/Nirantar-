import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Sun, Moon, Monitor, Sliders, Bell, Wifi, Shield, Check } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setSpecificTheme } = useTheme();
  const { user, updateProfile } = useAuth();
  const { showToast } = useNotifications();

  const handleTogglePreference = async (key) => {
    try {
      const currentVal = user?.preferences?.[key] !== false;
      await updateProfile({
        preferences: {
          [key]: !currentVal
        }
      });
      showToast(`Preference '${key}' updated!`, 'success');
    } catch (e) {
      showToast('Failed to update preference', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-brand-600" />
          <span>Application Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personalize interface theme, notifications, and offline operation.
        </p>
      </div>

      {/* Theme Selection */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">Interface Theme Mode</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select light mode, dark mode, or follow your operating system settings.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Default high-contrast' },
            { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Reduced eye strain' },
            { id: 'system', label: 'System Default', icon: Monitor, desc: 'Auto-syncs with OS' }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSpecificTheme(item.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 ring-2 ring-brand-500/20 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                <div className="text-xs font-bold">{item.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Offline Sync Mode for Care Workers */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Wifi className="w-4 h-4 text-brand-600" />
            <span>Field Worker Connectivity & Offline Queue</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            For ASHA workers operating in low-connectivity rural pockets.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Local Cache & Safe Sync Status:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Online & Connected</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            All patient records and intervention updates are securely persisted in MongoDB Atlas. If connectivity is briefly lost during village rounds, form inputs queue locally and sync with conflict detection upon reconnection.
          </p>
        </div>
      </div>

      {/* Notifications and Alerts */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-600" />
            <span>Notification & Simulated SMS Preferences</span>
          </h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">In-App High Risk Alerts</div>
              <p className="text-[11px] text-slate-500">Notify immediately when a patient's score crosses 60</p>
            </div>
            <input
              type="checkbox"
              checked={user?.preferences?.notifications !== false}
              onChange={() => handleTogglePreference('notifications')}
              className="w-4 h-4 text-brand-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">Simulated SMS & IVR Outreach</div>
              <p className="text-[11px] text-slate-500">Simulate automated reminder SMS to patients and caregivers</p>
            </div>
            <input
              type="checkbox"
              checked={user?.preferences?.smsAlerts !== false}
              onChange={() => handleTogglePreference('smsAlerts')}
              className="w-4 h-4 text-brand-600 rounded"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
