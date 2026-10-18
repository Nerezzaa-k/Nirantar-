import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { User, Mail, Phone, Shield, Building, MapPin, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useNotifications();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ name, phone });
      showToast('Profile information updated successfully!', 'success');
    } catch (e) {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-700 to-teal-900 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
          {user?.name ? user.name.charAt(0) : 'U'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h1>
          <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')} • Nirantar Network</p>
          <span className="inline-block mt-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Account Status: Active
          </span>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <h2 className="font-bold text-sm text-slate-900 dark:text-white">Profile Information</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address (Read-only)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Update Profile'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
